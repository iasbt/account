import { useState } from 'react';
import { Settings, FileText, BarChart2, List } from 'lucide-react';
import { EmailConfig } from './email/EmailConfig';
import { EmailLogs } from './email/EmailLogs';
import { EmailStatsView } from './email/EmailStats';
import { EmailTemplates } from './email/EmailTemplates';

type Tab = 'overview' | 'config' | 'templates' | 'logs';

export default function EmailManager() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart2, component: EmailStatsView },
    { id: 'config', label: '服务配置', icon: Settings, component: EmailConfig },
    { id: 'templates', label: '模板管理', icon: FileText, component: EmailTemplates },
    { id: 'logs', label: '发送日志', icon: List, component: EmailLogs },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">邮件服务中心</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && <EmailStatsView />}
        {activeTab === 'config' && <EmailConfig />}
        {activeTab === 'templates' && <EmailTemplates />}
        {activeTab === 'logs' && <EmailLogs />}
      </div>
    </div>
  );
}
