
import { useEffect, useState } from 'react';
import { adminService, EmailTemplate } from '../../services/adminService';
import { Mail, Save, RefreshCw, Eye, Code, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EmailManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>('register');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editor State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  
  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await adminService.getTemplates();
      setTemplates(data);
      // If we have data, select the first one or keep current selection if exists
      if (data.length > 0) {
        const current = data.find(t => t.type === selectedType) || data[0];
        setSelectedType(current.type);
        setSubject(current.subject);
        setContent(current.content);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle template selection change
  const handleTypeChange = (type: string) => {
    const template = templates.find(t => t.type === type);
    if (template) {
      setSelectedType(type);
      setSubject(template.subject);
      setContent(template.content);
      setTestResult(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateTemplate(selectedType, { subject, content });
      // Update local state
      setTemplates(templates.map(t => 
        t.type === selectedType ? { ...t, subject, content } : t
      ));
      alert('模板保存成功');
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    
    setSendingTest(true);
    setTestResult(null);
    try {
      // Note: The backend uses the DB template for the test, 
      // so we must save first if we want to test changes?
      // Or we should update the backend sendTestEmail to accept override content?
      // Currently sendTestEmail uses the stored template.
      // So let's warn user or auto-save?
      // For now, assume it uses the saved version.
      
      const res = await adminService.sendTestEmail(testEmail, selectedType);
      setTestResult({ success: true, message: '邮件发送成功' });
    } catch (err: unknown) {
      setTestResult({ 
        success: false, 
        message: err instanceof Error ? err.message : '发送失败' 
      });
    } finally {
      setSendingTest(false);
    }
  };

  const currentTemplate = templates.find(t => t.type === selectedType);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            邮件服务管理
          </h2>
          <p className="text-sm text-gray-500">管理系统邮件模板与服务配置</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchTemplates}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {templates.map(t => (
                  <button
                    key={t.type}
                    onClick={() => handleTypeChange(t.type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedType === t.type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {t.type === 'register' && '注册验证码'}
                    {t.type === 'reset_password' && '重置密码'}
                    {t.type === 'general' && '通用通知'}
                    {t.type === 'reset_link' && '重置链接'}
                    {!['register', 'reset_password', 'general', 'reset_link'].includes(t.type) && t.type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题 (Subject)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">HTML 内容</label>
                  <span className="text-xs text-gray-500">
                    可用变量: {currentTemplate?.variables?.map(v => `{{${v}}}`).join(', ') || '无'}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存模板'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Test */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">实时预览 (Preview)</h3>
            </div>
            <div className="flex-1 bg-white overflow-hidden relative">
               <iframe 
                 srcDoc={content}
                 className="w-full h-full border-0"
                 title="Preview"
                 sandbox="allow-same-origin" 
               />
               {/* Overlay to prevent interaction if needed, but allow scrolling */}
            </div>
          </div>

          {/* Test Send Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Send className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">发送测试 (Send Test)</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-500">
                将使用当前保存的模板发送测试邮件。请先保存更改。
              </p>
              <form onSubmit={handleSendTest} className="space-y-3">
                <input
                  type="email"
                  placeholder="接收邮箱地址..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingTest || !testEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {sendingTest ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      发送测试邮件
                    </>
                  )}
                </button>
              </form>

              {testResult && (
                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
