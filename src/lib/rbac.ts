import { CasdoorUser } from '../store/useAuthStore';

// 1. 定义权限原子 (Permissions)
// 使用 "资源:动作" 的格式，清晰明确
export type Permission = 
  | 'view:dashboard'      // 访问仪表盘
  | 'access:gallery'      // 访问相册应用
  | 'access:account'      // 访问个人中心
  | 'manage:system'       // 管理系统 (Casdoor 后台)
  | 'manage:users'        // 管理用户
  | 'view:analytics';     // 查看统计

// 2. 定义角色 (Roles)
export type Role = 'admin' | 'user' | 'guest';

// 3. 权限矩阵 (Permission Matrix)
// 明确每个角色拥有的精确权限集合
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view:dashboard',
    'access:gallery',
    'access:account',
    'manage:system',
    'manage:users',
    'view:analytics'
  ],
  user: [
    'view:dashboard',
    'access:gallery',
    'access:account'
  ],
  guest: [] // 访客无权限，需登录
};

// 4. 核心校验逻辑 (The "One Check" Function)
/**
 * 检查用户是否拥有指定权限
 * @param user 当前用户对象
 * @param requiredPermission 需要的权限
 * @returns boolean
 */
export function hasPermission(user: CasdoorUser | null, requiredPermission: Permission): boolean {
  if (!user) return false;

  // 1. 确定用户角色
  // 这里假设 CasdoorUser 有 isAdmin 字段，或者我们可以根据 user.type 等字段映射
  // 暂时复用现有的 isAdmin 逻辑映射为 'admin' 或 'user'
  const userRole: Role = user.isAdmin ? 'admin' : 'user';

  // 2. 获取该角色的权限集
  const permissions = ROLE_PERMISSIONS[userRole];

  // 3. 校验
  return permissions.includes(requiredPermission);
}

/**
 * 批量权限校验 (可选: 满足任一 或 满足所有)
 */
export function hasAnyPermission(user: CasdoorUser | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}
