import React, { useEffect, useState } from 'react';
import { adminService, type EmailProvider } from '../../../services/adminService';
import { Loader2, Plus, Trash, Edit, Check, Play, Server, Shield } from 'lucide-react';

interface EmailProviderForm extends Partial<EmailProvider> {
  auth_pass?: string;
}

export const EmailConfig: React.FC = () => {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<EmailProviderForm>({
    type: 'smtp',
    secure: true,
    port: 465,
    is_active: false
  });
  const [testEmail, setTestEmail] = useState('');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEmailProviders();
      setProviders(data);
      setError(null);
    } catch {
      setError('Failed to load email providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProvider.id) {
        await adminService.updateEmailProvider(currentProvider.id, currentProvider);
      } else {
        await adminService.createEmailProvider(currentProvider);
      }
      setIsDialogOpen(false);
      fetchProviders();
      alert('保存成功');
    } catch {
      alert('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除此配置吗?')) return;
    try {
      await adminService.deleteEmailProvider(id);
      fetchProviders();
    } catch {
      alert('删除失败');
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await adminService.setActiveProvider(id);
      fetchProviders();
      alert('已切换当前邮件服务配置');
    } catch {
      alert('切换失败');
    }
  };

  const handleTest = async () => {
    if (!testEmail || !testingId) return;
    
    try {
      await adminService.testProvider(testingId, testEmail);
      alert('测试邮件发送成功');
      setIsTestDialogOpen(false);
    } catch {
      alert('测试邮件发送失败');
    }
  };

  const openEdit = (provider: EmailProvider) => {
    setCurrentProvider(provider);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setCurrentProvider({ type: 'smtp', secure: true, port: 465, is_active: false });
    setIsDialogOpen(true);
  };

  const openTest = (id: number) => {
    setTestingId(id);
    setTestEmail('');
    setIsTestDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Server className="h-5 w-5" /> 邮件服务配置
        </h2>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> 新增配置
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发件人</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map(provider => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {provider.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" /> 使用中
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      备用
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{provider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 uppercase">{provider.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {provider.host}:{provider.port} 
                  {provider.secure && <Shield className="inline h-3 w-3 ml-1 text-green-500" />}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {provider.from_name} &lt;{provider.from_email}&gt;
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {!provider.is_active && (
                      <button 
                        onClick={() => handleSetActive(provider.id)}
                        className="text-green-600 hover:text-green-900"
                        title="设为活跃"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => openTest(provider.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="测试连接"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openEdit(provider)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-900"
                      title="删除"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  暂无配置，系统将使用环境变量作为默认回退。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{currentProvider.id ? '编辑配置' : '新增配置'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">配置名称</label>
                <input 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={currentProvider.name || ''}
                  onChange={e => setCurrentProvider({...currentProvider, name: e.target.value})}
                  placeholder="例如: 企业邮箱 SMTP"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">类型</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={currentProvider.type}
                  onChange={e => setCurrentProvider({...currentProvider, type: e.target.value as EmailProvider['type']})}
                  >
                    <option value="smtp">SMTP</option>
                    <option value="ses">AWS SES</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="resend">Resend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">端口</label>
                  <input 
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={currentProvider.port || ''}
                    onChange={e => setCurrentProvider({...currentProvider, port: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Host</label>
                <input 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={currentProvider.host || ''}
                  onChange={e => setCurrentProvider({...currentProvider, host: e.target.value})}
                  placeholder="smtp.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">用户名</label>
                <input 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={currentProvider.auth_user || ''}
                  onChange={e => setCurrentProvider({...currentProvider, auth_user: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">密码 / API Key</label>
                <input 
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={currentProvider.auth_pass || ''}
                  onChange={e => setCurrentProvider({...currentProvider, auth_pass: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">发件人名称</label>
                  <input 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={currentProvider.from_name || ''}
                    onChange={e => setCurrentProvider({...currentProvider, from_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">发件人邮箱</label>
                  <input 
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={currentProvider.from_email || ''}
                    onChange={e => setCurrentProvider({...currentProvider, from_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="secure"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={currentProvider.secure}
                  onChange={e => setCurrentProvider({...currentProvider, secure: e.target.checked})}
                />
                <label htmlFor="secure" className="ml-2 block text-sm text-gray-900">
                  使用 SSL/TLS 安全连接
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Dialog */}
      {isTestDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">发送测试邮件</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">收件人邮箱</label>
                <input 
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  onClick={() => setIsTestDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleTest}
                  disabled={!testEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
