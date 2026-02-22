import React from 'react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-16">
    <h2 className="text-3xl font-semibold tracking-tight text-text-primary mb-8 pb-4 border-b border-border-light">
      {title}
    </h2>
    <div className="space-y-8">{children}</div>
  </section>
);

const ColorCard = ({ name, hex, className }: { name: string; hex: string; className: string }) => (
  <div className="flex flex-col gap-2">
    <div className={`w-full h-32 rounded-2xl shadow-apple-card ${className}`}></div>
    <div className="flex flex-col">
      <span className="font-medium text-text-primary">{name}</span>
      <span className="text-sm text-text-secondary font-mono">{hex}</span>
    </div>
  </div>
);

const StyleGuide = () => {
  return (
    <div className="min-h-screen bg-background-light text-text-primary py-20 px-6 font-sans antialiased">
      <div className="max-w-screen-xl mx-auto">
        <header className="mb-20 text-center">
          <h1 className="text-6xl font-bold tracking-tighter mb-4 text-text-primary">
            设计系统
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            受 Apple 官方美学启发的极简主义高端设计语言。
            单色调色板、精致的排版和细腻的交互。
          </p>
        </header>

        <Section title="排版 (Typography)">
          <div className="space-y-8">
            <div>
              <p className="text-sm text-text-secondary mb-2">Display / 64px / Bold</p>
              <h1 className="text-6xl font-bold tracking-tighter">敏捷的棕色狐狸</h1>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Title 1 / 48px / Semibold</p>
              <h2 className="text-5xl font-semibold tracking-tight">跃过懒惰的狗</h2>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Title 2 / 32px / Medium</p>
              <h3 className="text-4xl font-medium tracking-tight">装满五打酒壶的盒子</h3>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Body / 17px / Regular</p>
              <p className="text-lg leading-relaxed text-text-primary max-w-2xl">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">Caption / 14px / Regular</p>
              <p className="text-sm text-text-secondary">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>
          </div>
        </Section>

        <Section title="调色板 (Color Palette)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ColorCard name="背景亮色 (Background Light)" hex="#f5f5f7" className="bg-background-light border border-border-light" />
            <ColorCard name="卡片表面 (Card Surface)" hex="#ffffff" className="bg-background-card border border-border-light" />
            <ColorCard name="主要文本 (Text Primary)" hex="#1d1d1f" className="bg-text-primary" />
            <ColorCard name="次要文本 (Text Secondary)" hex="#86868b" className="bg-text-secondary" />
            <ColorCard name="强调蓝 (Accent Blue)" hex="#0071e3" className="bg-accent-blue" />
            <ColorCard name="边框亮色 (Border Light)" hex="#d2d2d7" className="bg-border-light" />
          </div>
        </Section>

        <Section title="组件 (Components)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Buttons */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">按钮</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <button className="px-6 py-3 bg-accent-blue text-white rounded-full font-medium hover:bg-accent-hover transition-colors shadow-apple-hover">
                  主要按钮
                </button>
                <button className="px-6 py-3 bg-white text-accent-blue border border-border-light rounded-full font-medium hover:bg-background-light transition-colors">
                  次要按钮
                </button>
                <button className="text-accent-blue font-medium hover:underline">
                  文本链接 &rarr;
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">表单元素</h3>
              <div className="space-y-4 max-w-md">
                <input 
                  type="text" 
                  placeholder="电子邮箱" 
                  className="w-full px-4 py-4 rounded-xl border border-border-light bg-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-text-tertiary"
                />
                <input 
                  type="password" 
                  placeholder="密码" 
                  className="w-full px-4 py-4 rounded-xl border border-border-light bg-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-text-tertiary"
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="卡片与布局 (Cards & Layout)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-apple-card hover:shadow-apple-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border-subtle">
              <div className="w-12 h-12 bg-background-light rounded-xl mb-6 flex items-center justify-center text-2xl">
                ✨
              </div>
              <h3 className="text-xl font-semibold mb-2">优质品质</h3>
              <p className="text-text-secondary leading-relaxed">
                精心制作的组件，严格遵循设计指南，外观精致。
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-apple-card hover:shadow-apple-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border-subtle">
              <div className="w-12 h-12 bg-background-light rounded-xl mb-6 flex items-center justify-center text-2xl">
                🚀
              </div>
              <h3 className="text-xl font-semibold mb-2">高性能</h3>
              <p className="text-text-secondary leading-relaxed">
                针对速度和响应能力进行了优化，确保丝般顺滑的用户体验。
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-apple-card hover:shadow-apple-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border-subtle">
              <div className="w-12 h-12 bg-background-light rounded-xl mb-6 flex items-center justify-center text-2xl">
                🔒
              </div>
              <h3 className="text-xl font-semibold mb-2">安全隐私</h3>
              <p className="text-text-secondary leading-relaxed">
                建立在安全第一的原则之上，不惜一切代价保护用户数据和隐私。
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default StyleGuide;
