<template>
  <div class="legal-page container">
    <aside class="legal-nav">
      <p class="legal-nav-title">法律与政策</p>
      <nav>
        <router-link
          v-for="item in policyNav"
          :key="item.key"
          :to="item.to"
          :class="['legal-nav-link', { active: item.key === policyKey }]"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </aside>

    <article class="legal-document">
      <header class="legal-header">
        <span class="ns-tag">{{ policy.category }}</span>
        <h1>{{ policy.title }}</h1>
        <p class="legal-summary">{{ policy.summary }}</p>
        <div class="legal-meta">
          <span>生效日期：2026 年 9 月 22 日</span>
          <span>最近更新：2026 年 9 月 22 日</span>
        </div>
      </header>

      <section v-for="section in policy.sections" :key="section.title" class="legal-section">
        <h2>{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        <ul v-if="section.list">
          <li v-for="item in section.list" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="legal-section support-section">
        <h2>联系我们</h2>
        <p>如对本政策、账号信息或平台服务有任何疑问、意见或投诉，请联系 NorthStar 支持团队：</p>
        <a class="support-email" href="mailto:northstar2026@yeah.net">northstar2026@yeah.net</a>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  policyKey: {
    type: String,
    required: true
  }
})

const policyNav = [
  { key: 'terms', label: '用户协议', to: '/legal/terms' },
  { key: 'privacy', label: '隐私政策', to: '/legal/privacy' },
  { key: 'cookies', label: 'Cookie 协议', to: '/legal/cookies' }
]

const policies = {
  terms: {
    category: '使用条款',
    title: 'NorthStar 用户协议',
    summary: '本协议约定您注册、访问和使用 NorthStar MC竞技平台时应遵守的规则，以及您与本平台之间的权利和义务。',
    sections: [
      {
        title: '1. 协议范围与接受',
        paragraphs: [
          '本协议适用于 NorthStar MC竞技平台提供的网站、账号、游戏数据、房间、排行榜、内测资格及相关功能。创建账号、勾选同意或继续使用本平台，即表示您已阅读、理解并同意本协议及《隐私政策》《Cookie 协议》。',
          '如您不同意上述条款，请停止注册或使用本平台。为保障服务安全或遵守法律要求，我们可能对协议进行修订；重大变化将在本页面公布。'
        ]
      },
      {
        title: '2. 账号注册与安全',
        paragraphs: [
          '您应提供真实、准确、完整的注册信息，并在信息变化时及时更新。用户名、邮箱、密码及邮箱验证码用于创建和保护账号；离线服 Minecraft ID 为选填绑定信息。',
          '您应妥善保管账号凭证，不得出售、出租、转让或允许他人未经授权使用账号。发现账号被盗、泄露或存在异常时，请立即通过支持邮箱联系我们。'
        ],
        list: [
          '不得冒用他人身份或使用误导性账号名称。',
          '不得批量注册、买卖账号或绕过平台限制。',
          '不得使用自动化方式注册、登录或滥用验证码服务。',
          '您应对账号下发生的活动承担相应责任，但法律另有规定的除外。'
        ]
      },
      {
        title: '3. 平台服务与数据',
        paragraphs: [
          '本平台提供 Minecraft 游戏战绩展示、排行榜、房间信息及相关社区功能。游戏数据可能来自您主动绑定的信息、对局记录或平台统计，因数据同步延迟、服务中断或游戏环境差异，展示内容可能与实际情况不完全一致。',
          '平台功能可能持续调整、测试、暂停或下线。涉及内测功能时，我们可依据稳定性、公平性或运营需要调整测试范围和资格。'
        ]
      },
      {
        title: '4. 用户行为规范',
        paragraphs: [
          '您在使用平台及发布名称、房间信息、申请内容等材料时，应遵守法律法规并尊重他人合法权益。不得实施或协助实施以下行为：'
        ],
        list: [
          '发布违法违规、欺诈、骚扰、歧视、淫秽、暴力或侵害隐私的内容。',
          '作弊、代打、操纵比赛结果、利用漏洞或干扰其他用户正常使用。',
          '攻击、扫描、爬取、反向编译或以其他方式破坏平台系统和数据安全。',
          '侵犯商标、著作权、肖像权、个人信息权益或其他第三方权益。',
          '利用平台从事未经许可的商业推广、赌博、洗钱或其他违法活动。'
        ]
      },
      {
        title: '5. 内容与知识产权',
        paragraphs: [
          'NorthStar 平台的软件、界面、标识、文案、统计数据组织形式及其他内容的知识产权归本平台或合法权利人所有。在遵守本协议的前提下，我们授予您有限、非独占、不可转让的个人使用许可。',
          '您保留自行发布内容的合法权利。为运营、展示、备份和改进相关服务，您授予本平台在必要范围内存储、处理和展示该内容的许可。您应确保拥有发布相关内容所需的全部权利。'
        ]
      },
      {
        title: '6. 服务限制与责任',
        paragraphs: [
          '在法律允许的范围内，本平台按“现状”和“可用”状态提供服务。对于不可抗力、网络故障、第三方服务、用户设备或非本平台可控原因造成的服务中断、数据延迟或损失，本平台在依法应负责的范围内承担责任。',
          '如您违反本协议、侵害他人权益或存在安全风险，我们可采取提醒、限制功能、暂停或终止账号、保留记录及依法处理等措施。'
        ]
      },
      {
        title: '7. 协议终止与争议处理',
        paragraphs: [
          '您可以停止使用并申请注销账号；我们也可依法或依约终止服务。协议中按其性质应在终止后继续有效的条款，包括知识产权、责任限制和争议解决条款，仍继续有效。',
          '如发生争议，双方应先通过支持邮箱友好协商。协商不成的，依照适用法律及相关争议解决规则处理。'
        ]
      }
    ]
  },
  privacy: {
    category: '个人信息',
    title: 'NorthStar 隐私政策',
    summary: '本政策说明我们如何收集、使用、存储、共享和保护您的个人信息，以及您依法享有的相关权利。',
    sections: [
      {
        title: '1. 我们收集的信息',
        paragraphs: ['为提供账号和平台服务，我们可能收集以下必要信息：'],
        list: [
          '账号信息：用户名、电子邮箱、加密后的密码及邮箱验证状态。',
          '游戏关联信息：您选填的离线服 Minecraft ID、游戏战绩、对局记录和排行榜数据。',
          '服务信息：房间、内测申请、功能使用记录，以及为维护安全形成的日志。',
          '设备与网络信息：IP 地址、浏览器类型、访问时间、页面操作和故障诊断信息。',
          '您主动提供的其他信息：例如通过支持邮箱提交的问题、附件或说明。'
        ]
      },
      {
        title: '2. 我们如何使用信息',
        paragraphs: ['我们仅在实现产品功能、保障安全和履行法律义务的必要范围内处理个人信息：'],
        list: [
          '创建、验证、管理和保护您的账号。',
          '展示 Minecraft 战绩、排行榜、房间和相关统计数据。',
          '处理内测资格申请、邀请和平台运营事务。',
          '预防欺诈、垃圾注册、滥用行为和安全事件。',
          '分析服务表现、修复故障并改进产品体验。',
          '回复咨询、投诉和账号相关请求，并履行法律法规要求。'
        ]
      },
      {
        title: '3. Cookie 与类似技术',
        paragraphs: [
          '我们可能使用 Cookie、本地存储和类似技术维持登录状态、保存必要偏好并保障服务安全。具体类型、用途和管理方式详见《Cookie 协议》。'
        ]
      },
      {
        title: '4. 信息共享与委托处理',
        paragraphs: [
          '我们不会出售您的个人信息。仅在取得合法授权、您主动选择、实现必要服务或法律要求的情况下，向具备相应保护能力的接收方提供信息。',
          '为提供邮件验证、云基础设施、安全防护或技术支持，我们可能委托必要的第三方处理有限信息，并要求其按照法律和本政策采取保护措施。平台包含第三方资源或链接时，该第三方将依据其自身政策处理信息。'
        ]
      },
      {
        title: '5. 存储期限与安全',
        paragraphs: [
          '我们仅在实现本政策所述目的、履行法定义务或处理争议所必需的期限内保存个人信息。期限届满后，我们将删除、匿名化或依法隔离保存。',
          '我们采取访问控制、密码加密、日志监测和人员管理等合理措施保护信息。互联网服务无法保证绝对安全；如发生可能影响您权益的安全事件，我们将依法通知您并采取补救措施。'
        ]
      },
      {
        title: '6. 您的权利',
        paragraphs: ['在适用法律规定的范围内，您可以向支持邮箱提出以下请求：'],
        list: [
          '查询、复制或更正您的个人信息。',
          '删除信息、撤回授权或申请注销账号。',
          '限制或拒绝特定处理，要求解释个人信息处理规则。',
          '撤回营销或非必要信息推送授权，但不影响撤回前基于授权已进行的处理。',
          '对我们的处理决定提出异议或投诉。'
        ]
      },
      {
        title: '7. 未成年人保护',
        paragraphs: [
          '未成年人应在监护人指导下阅读本政策并使用平台。若我们发现未经适当同意收集了未成年人个人信息，将依法尽快删除或采取其他必要保护措施。'
        ]
      },
      {
        title: '8. 政策更新与跨境处理',
        paragraphs: [
          '我们可能根据服务和法律变化更新本政策，并在本页面标明更新日期。涉及对您权益产生重大影响的变化时，我们将以显著方式提示。',
          '若因技术支持或基础设施发生跨境数据传输，我们将依照适用法律采取必要保障措施。'
        ]
      }
    ]
  },
  cookies: {
    category: 'Cookie 与存储',
    title: 'NorthStar Cookie 协议',
    summary: '本协议说明 NorthStar 使用 Cookie、本地存储及类似技术的类型、目的和管理方式。',
    sections: [
      {
        title: '1. 什么是 Cookie 与类似技术',
        paragraphs: [
          'Cookie 是网站保存在浏览器中的小型文本信息。类似技术还包括本地存储、会话存储、像素标签和设备标识。它们可用于保持登录、保存偏好、识别异常访问和改进服务。',
          '本平台当前主要通过浏览器本地存储保存登录令牌和用户摘要信息；未来为实现具体功能，也可能使用 Cookie 或其他类似技术。'
        ]
      },
      {
        title: '2. 我们使用的技术类型',
        paragraphs: ['根据用途，相关技术分为以下类别：'],
        list: [
          '必要技术：用于登录、身份验证、安全防护、负载处理和提供您主动请求的功能。',
          '偏好技术：保存界面、语言或其他您选择的设置，使下次访问更加便捷。',
          '分析技术：了解页面访问、功能使用和故障情况，以评估并改进服务质量。',
          '第三方技术：第三方提供的字体、邮件、安全或基础设施资源可能设置其自身技术，并受第三方政策约束。'
        ]
      },
      {
        title: '3. 具体用途',
        paragraphs: [
          '我们可能使用上述技术维持账号会话、防止重复提交、记住必要设置、识别滥用行为、衡量服务可用性，以及排查性能和安全问题。',
          '必要技术是提供账号和核心功能所必需的。禁用后，您可能无法登录、完成注册或使用依赖会话的功能。'
        ]
      },
      {
        title: '4. 保存期限',
        paragraphs: [
          '会话类信息通常在浏览器会话结束或达到预设期限后失效；持久类信息会保存至到期、被删除或不再具有使用必要。为安全和法律要求，我们可能在服务器端保留必要的访问和审计日志。'
        ]
      },
      {
        title: '5. 管理与拒绝',
        paragraphs: [
          '您可以通过浏览器设置查看、阻止或删除 Cookie 和本地存储。常见路径位于浏览器的“隐私”“网站设置”或“Cookie 与网站数据”选项中。',
          '浏览器通常允许按网站删除数据。请根据所用浏览器的帮助说明操作。限制必要技术可能导致账号退出、设置丢失或部分服务不可用。'
        ]
      },
      {
        title: '6. 第三方技术',
        paragraphs: [
          '当您使用依赖第三方资源的功能时，相关第三方可能根据其政策收集网络和技术信息。建议同时查阅第三方的隐私与 Cookie 说明。我们会在合理范围内选择和管理服务提供方。'
        ]
      },
      {
        title: '7. 协议更新',
        paragraphs: [
          '技术、功能或法律要求变化时，我们可能更新本协议并调整本页面的生效日期。重大调整将在平台内以合理方式提示。'
        ]
      }
    ]
  }
}

const policy = computed(() => policies[props.policyKey])
</script>

<style scoped>
.legal-page {
  display: grid;
  grid-template-columns: 220px minmax(0, 820px);
  gap: 56px;
  align-items: start;
  padding-top: 48px;
  padding-bottom: 88px;
}

.legal-nav {
  position: sticky;
  top: 100px;
}

.legal-nav-title {
  margin-bottom: 14px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.legal-nav nav {
  display: flex;
  flex-direction: column;
}

.legal-nav-link {
  border-left: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  padding: 11px 14px;
}

.legal-nav-link:hover,
.legal-nav-link.active {
  border-left-color: var(--accent-primary);
  color: var(--text-primary);
  background: rgba(255, 140, 0, 0.06);
}

.legal-document {
  min-width: 0;
}

.legal-header {
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 36px;
  padding-bottom: 28px;
}

.legal-header h1 {
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  font-size: 34px;
  line-height: 1.3;
  margin: 16px 0;
}

.legal-summary {
  color: var(--text-secondary);
  line-height: 1.8;
  max-width: 720px;
}

.legal-meta {
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 20px;
  margin-top: 18px;
}

.legal-section {
  margin-bottom: 34px;
}

.legal-section h2 {
  font-size: 19px;
  margin-bottom: 14px;
}

.legal-section p {
  color: var(--text-secondary);
  line-height: 1.9;
  margin-bottom: 12px;
}

.legal-section ul {
  color: var(--text-secondary);
  line-height: 1.8;
  padding-left: 22px;
}

.legal-section li {
  margin-bottom: 8px;
}

.support-section {
  border-top: 1px solid var(--border-color);
  padding-top: 30px;
}

.support-email {
  display: inline-block;
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 820px) {
  .legal-page {
    grid-template-columns: 1fr;
    gap: 30px;
    padding-top: 30px;
  }

  .legal-nav {
    position: static;
  }

  .legal-nav nav {
    border-bottom: 1px solid var(--border-color);
    flex-direction: row;
    overflow-x: auto;
  }

  .legal-nav-link {
    border-left: 0;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
  }

  .legal-nav-link:hover,
  .legal-nav-link.active {
    border-bottom-color: var(--accent-primary);
  }

  .legal-header h1 {
    font-size: 27px;
  }
}
</style>
