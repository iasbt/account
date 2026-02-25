import React, { useEffect, useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { adminService, type EmailTemplate } from '../../../services/adminService';
import { Loader2, Save, RefreshCw, Code, Send, AlertCircle, CheckCircle2, Eye } from 'lucide-react';

export const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>('register');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  
  // Editor State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Ref to track selectedType without triggering re-renders in useCallback
  const selectedTypeRef = useRef(selectedType);

  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getTemplates();
      setTemplates(data);
      // If we have data, select the first one or keep current selection if exists
      if (data.length > 0) {
        const currentType = selectedTypeRef.current;
        const current = data.find(t => t.type === currentType) || data[0];
        setSelectedType(current.type);
        setSubject(current.subject);
        setContent(current.content);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle template selection change
  const handleTypeChange = (type: string) => {
    const template = templates.find(t => t.type === type);
    if (template) {
      setSelectedType(type);
      setSubject(template.subject);
      setContent(template.content);
      setTestResult(null);
      setMode('edit');
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
      await adminService.sendTestEmail(testEmail, selectedType);
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

  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable}}}` + after;
      setContent(newText);
      
      // Restore focus and cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + variable.length + 4; // {{}} is 4 chars
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      // Fallback if ref is not available (e.g. in preview mode)
      setContent(prev => prev + `{{${variable}}}`);
    }
  };

  const currentTemplate = templates.find(t => t.type === selectedType);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">邮件模板编辑器</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'edit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" /> 编辑
              </div>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'preview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> 预览
              </div>
            </button>
          </div>
          <button 
            onClick={fetchTemplates} 
            className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Selection & Preview */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择模板</label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.type}>
                  {t.type} - {t.subject}
                </option>
              ))}
            </select>
            
            {currentTemplate && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-md">
                <p className="font-semibold mb-2">点击插入变量:</p>
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.variables.map(v => (
                    <button 
                      key={v} 
                      onClick={() => insertVariable(v)}
                      className="bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-sm"
                      title={`Insert {{${v}}}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Email Card */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Send className="w-4 h-4" /> 发送测试
            </h3>
            <form onSubmit={handleSendTest} className="space-y-3">
              <input
                type="email"
                required
                placeholder="接收测试邮件的邮箱"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
              />
              <button
                type="submit"
                disabled={sendingTest || !testEmail}
                className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                发送测试邮件
              </button>
            </form>

            {testResult && (
              <div className={`mt-3 p-3 rounded-md flex items-start gap-2 text-sm ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-lg border shadow-sm h-full flex flex-col min-h-[600px]">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>{mode === 'edit' ? 'HTML 代码' : '实时预览'}</span>
                {mode === 'edit' && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Code className="w-3 h-3" /> 支持 HTML 标签
                  </span>
                )}
              </label>
              
              {mode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm p-3 border resize-none"
                  spellCheck={false}
                />
              ) : (
                <div 
                  className="w-full flex-1 border border-gray-200 rounded-md p-4 bg-gray-50 overflow-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                />
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
