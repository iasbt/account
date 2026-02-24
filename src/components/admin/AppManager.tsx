
import { useState, useEffect } from 'react';
import { appService, type App, type CreateAppDto, type UpdateAppDto } from '../../services/appService';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

export default function AppManager() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateAppDto>({
    name: '',
    appId: '',
    allowedOrigins: [],
    tokenType: 'standard',
    secret: ''
  });
  
  // Helper state for allowed origins input (string)
  const [originsInput, setOriginsInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await appService.getApps();
      setApps(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleOpenCreate = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      appId: '',
      allowedOrigins: [],
      tokenType: 'standard',
      secret: crypto.randomUUID().replace(/-/g, '') // Auto-generate secret
    });
    setOriginsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: App) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      appId: app.app_id,
      allowedOrigins: app.allowed_origins,
      tokenType: app.token_type,
      secret: app.secret
    });
    setOriginsInput(app.allowed_origins.join('\n'));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除此应用吗？此操作不可恢复。')) return;
    try {
      await appService.deleteApp(id);
      setApps(apps.filter(a => a.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Process origins input
    const origins = originsInput.split('\n').map(s => s.trim()).filter(Boolean);
    
    try {
      if (editingApp) {
        const updateData: UpdateAppDto = {
          name: formData.name,
          allowedOrigins: origins,
          tokenType: formData.tokenType,
          secret: formData.secret
        };
        const updated = await appService.updateApp(editingApp.id, updateData);
        setApps(apps.map(a => a.id === editingApp.id ? updated : a));
      } else {
        const createData: CreateAppDto = {
          ...formData,
          allowedOrigins: origins
        };
        const created = await appService.createApp(createData);
        setApps([...apps, created]);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setFormLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  if (loading) return <div className="p-4 text-center">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">应用管理 (Applications)</h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>新建应用</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">应用名称</th>
                <th className="p-4 font-medium">App ID</th>
                <th className="p-4 font-medium">Token 类型</th>
                <th className="p-4 font-medium">允许的域名 (Origins)</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{app.name}</td>
                  <td className="p-4 font-mono text-sm text-blue-600">{app.app_id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      app.token_type === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {app.token_type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 max-w-xs truncate" title={app.allowed_origins.join('\n')}>
                    {app.allowed_origins.length > 0 ? app.allowed_origins[0] : '-'}
                    {app.allowed_origins.length > 1 && ` (+${app.allowed_origins.length - 1})`}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(app)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    暂无应用，点击右上角创建
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingApp ? '编辑应用' : '新建应用'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">应用名称</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="例如: Image Gallery"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">App ID (唯一标识)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingApp}
                    value={formData.appId}
                    onChange={e => setFormData({ ...formData, appId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="例如: gallery"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Token 类型</label>
                <select
                  value={formData.tokenType}
                  onChange={e => setFormData({ ...formData, tokenType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="standard">Standard JWT (默认)</option>
                  <option value="supabase">Supabase Compatible (GoTrue)</option>
                </select>
                <p className="text-xs text-gray-500">
                  如果应用使用 Supabase 客户端，请选择 Supabase Compatible。
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Allowed Origins (一行一个)</label>
                <textarea
                  required
                  value={originsInput}
                  onChange={e => setOriginsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm h-24 resize-none"
                  placeholder="https://gallery.iasbt.com&#10;http://localhost:5173"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">SSO Secret (密钥)</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    required
                    value={formData.secret}
                    onChange={e => setFormData({ ...formData, secret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, secret: crypto.randomUUID().replace(/-/g, '') })}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="生成新密钥"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.secret)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="复制"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-70 flex items-center gap-2"
                >
                  {formLoading && <RefreshCw className="animate-spin" size={16} />}
                  {editingApp ? '保存更改' : '立即创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
