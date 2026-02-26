
import { z } from "zod";

export const sendCodeSchema = z.object({
  body: z.object({
    email: z.string().email("无效的邮箱格式"),
    type: z.enum(["general", "register", "reset_password"]).optional()
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "用户名至少2个字符").max(50, "用户名过长"),
    email: z.string().email("无效的邮箱格式"),
    password: z.string().min(6, "密码至少6位"),
    code: z.string().length(6, "验证码必须为6位")
  })
});

export const loginSchema = z.object({
  body: z.object({
    account: z.string().min(1, "账号不能为空"),
    password: z.string().min(1, "密码不能为空")
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("无效的邮箱格式"),
    password: z.string().min(6, "密码至少6位"),
    code: z.string().length(6, "验证码必须为6位")
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "旧密码不能为空"),
    newPassword: z.string().min(6, "新密码至少6位")
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "用户名至少2个字符").max(50, "用户名过长").optional(),
    avatar: z.string().optional()
  })
});
