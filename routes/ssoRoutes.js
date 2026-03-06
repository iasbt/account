import { Router } from "express";
import { oidcProvider, verifyAccessToken } from "../services/oidcProvider.js";

const router = Router();

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.split(" ")[1];
};

const getCookieToken = (req) => {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map(part => part.trim()).find(part => part.startsWith("account_token="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
};

router.get("/interaction/:uid", async (req, res, next) => {
  try {
    const details = await oidcProvider.interactionDetails(req, res);
    const { prompt, params, session, grantId } = details;

    if (prompt.name === "login") {
      const token = getBearerToken(req) || getCookieToken(req);
      const payload = token ? await verifyAccessToken(token) : null;
      if (!payload || !payload.sub) {
        // Redirect to frontend login if not authenticated
        // This allows seamless SSO flow (User -> Login -> Back to Interaction)
        const returnUrl = `/api/interaction/${req.params.uid}`;
        return res.redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      }

      return await oidcProvider.interactionFinished(
        req,
        res,
        { login: { accountId: payload.sub } },
        { mergeWithLastSubmission: false }
      );
    }

    if (prompt.name === "consent") {
      let grant = grantId ? await oidcProvider.Grant.find(grantId) : null;
      if (!grant) {
        grant = new oidcProvider.Grant({
          accountId: session.accountId,
          clientId: params.client_id
        });
      }

      if (prompt.details?.missingOIDCScope) {
        grant.addOIDCScope(prompt.details.missingOIDCScope.join(" "));
      }

      if (prompt.details?.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(prompt.details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(" "));
        }
      }

      const savedGrantId = await grant.save();
      return await oidcProvider.interactionFinished(
        req,
        res,
        { consent: { grantId: savedGrantId } },
        { mergeWithLastSubmission: true }
      );
    }

    return res.status(400).json({ message: "不支持的交互类型" });
  } catch (error) {
    return next(error);
  }
});

router.use(oidcProvider.callback());

export default router;
