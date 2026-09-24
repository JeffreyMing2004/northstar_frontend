<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <div class="sidebar-title">
        <NsIcon name="shield-check" :size="22" />
        <span>ADMIN CONSOLE</span>
      </div>

      <nav class="admin-nav" aria-label="管理功能">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['nav-button', { active: activeTab === tab.key }]"
          type="button"
          @click="activeTab = tab.key"
        >
          <NsIcon :name="tab.icon" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.key === 'beta' && overview.pendingBetaApplications" class="nav-count">
            {{ overview.pendingBetaApplications }}
          </span>
        </button>
      </nav>

      <div class="sidebar-account">
        <PlayerAvatar
          :player-id="currentUser?.mcId || currentUser?.username || 'admin'"
          :label="currentUser?.username || '管理员'"
          :size="38"
        />
        <div class="account-copy">
          <strong>{{ currentUser?.username || '管理员' }}</strong>
          <span>ADMINISTRATOR</span>
        </div>
      </div>
    </aside>

    <main class="admin-workspace">
      <header class="workspace-header">
        <div>
          <span class="workspace-kicker">NORTHSTAR OPERATIONS</span>
          <h1>{{ activeTabMeta.label }}</h1>
        </div>
        <button class="icon-button" type="button" title="刷新管理数据" aria-label="刷新管理数据" @click="refreshAll">
          <NsIcon name="refresh" :size="18" />
        </button>
      </header>

      <div v-if="notice" class="notice-bar success">
        <NsIcon name="check-circle" />
        <span>{{ notice }}</span>
      </div>
      <div v-if="error" class="notice-bar error">
        <NsIcon name="warning" />
        <span>{{ error }}</span>
        <button type="button" @click="refreshAll">重试</button>
      </div>

      <div v-if="loading" class="admin-state">
        <NsIcon name="refresh" :size="32" />
        <span>正在加载管理数据</span>
      </div>

      <template v-else>
        <section v-if="activeTab === 'overview'" class="workspace-section">
          <div class="metrics-grid">
            <article v-for="metric in metricItems" :key="metric.label" class="metric-card">
              <div class="metric-icon"><NsIcon :name="metric.icon" :size="21" /></div>
              <strong>{{ metric.value.toLocaleString() }}</strong>
              <span>{{ metric.label }}</span>
            </article>
          </div>

          <div class="overview-grid">
            <section class="data-section">
              <div class="section-header">
                <div>
                  <span class="section-kicker">REVIEW QUEUE</span>
                  <h2>待审核申请</h2>
                </div>
                <button class="text-button" type="button" @click="activeTab = 'beta'">
                  全部申请 <NsIcon name="arrow-right" />
                </button>
              </div>
              <div class="table-shell compact-shell">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>申请人</th>
                      <th>申请理由</th>
                      <th>提交时间</th>
                      <th class="action-column">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="application in pendingApplications" :key="application.id">
                      <td>
                        <strong>{{ application.username || application.email }}</strong>
                        <span class="cell-subtext">{{ application.mcId || '未绑定 MC ID' }}</span>
                      </td>
                      <td>{{ reasonLabel(application.reason) }}</td>
                      <td>{{ application.createdAt }}</td>
                      <td>
                        <div class="row-actions">
                          <button
                            class="icon-button positive"
                            type="button"
                            title="通过申请"
                            aria-label="通过申请"
                            :disabled="actionLoading"
                            @click="decideBeta(application, 'approved')"
                          >
                            <NsIcon name="check" />
                          </button>
                          <button
                            class="icon-button negative"
                            type="button"
                            title="拒绝申请"
                            aria-label="拒绝申请"
                            :disabled="actionLoading"
                            @click="decideBeta(application, 'denied')"
                          >
                            <NsIcon name="close-circle" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="!pendingApplications.length" class="empty-row">暂无待审核申请</div>
              </div>
            </section>

            <section class="data-section">
              <div class="section-header">
                <div>
                  <span class="section-kicker">MATCH ACTIVITY</span>
                  <h2>最新对局</h2>
                </div>
                <button class="text-button" type="button" @click="activeTab = 'matches'">
                  查看记录 <NsIcon name="arrow-right" />
                </button>
              </div>
              <div class="activity-list">
                <article v-for="match in matches.slice(0, 6)" :key="match.id" class="activity-row">
                  <span :class="['result-mark', match.win ? 'win' : 'loss']">
                    {{ match.win ? '胜' : '负' }}
                  </span>
                  <div class="activity-copy">
                    <strong>{{ match.username }}</strong>
                    <span>{{ match.mode }} · {{ match.mapName }}</span>
                  </div>
                  <div class="activity-score">
                    <strong>{{ match.kills }} / {{ match.deaths }} / {{ match.assists }}</strong>
                    <span>{{ match.playedAt }}</span>
                  </div>
                </article>
                <div v-if="!matches.length" class="empty-row">暂无对局记录</div>
              </div>
            </section>
          </div>
        </section>

        <section v-else-if="activeTab === 'users'" class="workspace-section">
          <div class="toolbar">
            <div class="search-control">
              <NsIcon name="search" />
              <input
                v-model="userSearch"
                class="field-input"
                placeholder="搜索用户名、邮箱或 MC ID"
                @keyup.enter="loadUsers"
              />
            </div>
            <select v-model="userBetaFilter" class="field-select" aria-label="内测状态筛选">
              <option value="">全部内测状态</option>
              <option value="none">未获得</option>
              <option value="pending">审核中</option>
              <option value="approved">已通过</option>
              <option value="denied">已拒绝</option>
            </select>
            <button class="command-button" type="button" @click="loadUsers">
              <NsIcon name="search" /> 查询
            </button>
            <span v-if="overview.maxAdmins" class="capacity-label">
              管理员 {{ overview.adminCount || 0 }} / {{ overview.maxAdmins }}
            </span>
          </div>

          <div class="table-shell">
            <table class="data-table user-table">
              <thead>
                <tr>
                  <th>玩家</th>
                  <th>联系方式</th>
                  <th>段位 / 评分</th>
                  <th>战绩</th>
                  <th>内测资格</th>
                  <th>账号角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="player-cell">
                      <PlayerAvatar :player-id="user.mcId || user.username" :label="user.username" :size="36" />
                      <div>
                        <strong>{{ user.username }}</strong>
                        <span class="cell-subtext">{{ user.mcId || '未绑定 MC ID' }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{{ user.email }}</span>
                    <span class="cell-subtext">{{ formatDate(user.createdAt) }}</span>
                  </td>
                  <td>
                    <strong>{{ user.rank }}</strong>
                    <span class="score-value">{{ user.score }}</span>
                  </td>
                  <td>
                    <span>{{ user.wins }} 胜 / {{ user.losses }} 负</span>
                    <span class="cell-subtext">{{ user.totalKills }} 击杀 · {{ user.totalDeaths }} 死亡</span>
                  </td>
                  <td><span :class="['status-tag', betaStatusClass(user.betaStatus)]">{{ betaStatusLabel(user.betaStatus) }}</span></td>
                  <td><span :class="['role-tag', user.role === 'admin' ? 'admin' : '']">{{ user.role === 'admin' ? '管理员' : '玩家' }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button
                        v-if="!user.adminLocked"
                        class="icon-button"
                        :class="user.role === 'admin' ? 'negative' : 'positive'"
                        type="button"
                        :title="user.role === 'admin' ? '取消管理员身份' : '授予管理员身份'"
                        :aria-label="user.role === 'admin' ? '取消管理员身份' : '授予管理员身份'"
                        :disabled="actionLoading"
                        @click="changeAdminRole(user)"
                      >
                        <NsIcon :name="user.role === 'admin' ? 'ban' : 'user-plus'" />
                      </button>
                      <span v-else class="muted-value">内置</span>
                      <button class="icon-button" type="button" title="编辑玩家" aria-label="编辑玩家" @click="openEditUser(user)">
                        <NsIcon name="edit" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="!users.length" class="empty-row">未找到匹配的玩家</div>
          </div>
        </section>

        <section v-else-if="activeTab === 'beta'" class="workspace-section">
          <div class="toolbar beta-mode-toolbar">
            <div class="segmented-control" aria-label="内测管理视图">
              <button
                v-for="option in betaModeOptions"
                :key="option.value"
                :class="{ active: betaMode === option.value }"
                type="button"
                @click="betaMode = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <template v-if="betaMode === 'members'">
            <div class="toolbar beta-toolbar">
              <div class="segmented-control" aria-label="申请状态">
                <button
                  v-for="option in betaFilterOptions"
                  :key="option.value"
                  :class="{ active: betaFilter === option.value }"
                  type="button"
                  @click="betaFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <button class="command-button" type="button" @click="openBetaAdd">
                <NsIcon name="user-plus" /> 添加内测人员
              </button>
            </div>

            <div class="table-shell">
              <table class="data-table beta-table">
                <thead>
                  <tr>
                    <th>申请人</th>
                    <th>邮箱</th>
                    <th>MC ID</th>
                    <th>所属计划</th>
                    <th>申请理由</th>
                    <th>提交时间</th>
                    <th>状态</th>
                    <th class="action-column">审核</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="application in betaApplications" :key="application.id">
                    <td><strong>{{ application.username || '未命名用户' }}</strong></td>
                    <td>{{ application.email }}</td>
                    <td>{{ application.mcId || '—' }}</td>
                    <td>{{ planLabel(application.planId) }}</td>
                    <td>{{ reasonLabel(application.reason) }}</td>
                    <td>{{ application.createdAt }}</td>
                    <td><span :class="['status-tag', betaStatusClass(application.status)]">{{ betaStatusLabel(application.status) }}</span></td>
                    <td>
                      <div v-if="application.status === 'pending'" class="row-actions">
                        <button class="icon-button positive" type="button" title="通过申请" aria-label="通过申请" @click="decideBeta(application, 'approved')">
                          <NsIcon name="check" />
                        </button>
                        <button class="icon-button negative" type="button" title="拒绝申请" aria-label="拒绝申请" @click="decideBeta(application, 'denied')">
                          <NsIcon name="close-circle" />
                        </button>
                      </div>
                      <span v-else class="muted-value">已处理</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="!betaApplications.length" class="empty-row">暂无内测申请</div>
            </div>
          </template>

          <template v-else-if="betaMode === 'plans'">
            <div class="toolbar beta-toolbar">
              <span class="result-count">{{ betaPlans.length }} 个计划</span>
              <button class="command-button" type="button" @click="openBetaPlan()">
                <NsIcon name="plus" /> 新建内测计划
              </button>
            </div>

            <div class="table-shell">
              <table class="data-table beta-plan-table">
                <thead>
                  <tr>
                    <th>阶段</th>
                    <th>计划名称</th>
                    <th>计划周期</th>
                    <th>通过人数 / 名额</th>
                    <th>可体验模式</th>
                    <th>状态</th>
                    <th class="action-column">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="plan in betaPlans" :key="plan.id">
                    <td><span class="plan-phase">{{ plan.phase }}</span></td>
                    <td>
                      <strong>{{ plan.name }}</strong>
                      <span class="cell-subtext plan-description">{{ plan.description || '暂无计划说明' }}</span>
                    </td>
                    <td>
                      <span>{{ plan.startsOn || '不限' }} 至 {{ plan.endsOn || '长期' }}</span>
                    </td>
                    <td class="numeric-cell">{{ plan.approvedCount }} / {{ plan.capacity }}</td>
                    <td>{{ plan.allowedModes || '全部模式' }}</td>
                    <td>
                      <select
                        class="status-select"
                        :value="plan.status"
                        :disabled="actionLoading"
                        @change="changeBetaPlanStatus(plan, $event.target.value)"
                      >
                        <option value="draft">草稿</option>
                        <option value="active">开放</option>
                        <option value="paused">暂停</option>
                        <option value="completed">完成</option>
                      </select>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button class="icon-button" type="button" title="编辑计划" aria-label="编辑计划" @click="openBetaPlan(plan)">
                          <NsIcon name="edit" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="!betaPlans.length" class="empty-row">暂无内测计划，请新建计划</div>
            </div>
          </template>

          <template v-else-if="betaMode === 'whitelist'">
            <div class="toolbar beta-toolbar">
              <div class="search-control">
                <NsIcon name="search" />
                <input
                  v-model="whitelistSearch"
                  class="field-input"
                  placeholder="搜索 QQ、游戏 ID、昵称或备注"
                  @keyup.enter="searchBetaWhitelist"
                />
              </div>
              <select v-model="whitelistStatus" class="field-select" aria-label="白名单状态筛选">
                <option value="">全部状态</option>
                <option value="1">启用</option>
                <option value="0">禁用</option>
              </select>
              <div class="toolbar-actions">
                <button
                  class="command-button secondary"
                  type="button"
                  :disabled="actionLoading"
                  title="按「已通过」的账号状态重建白名单，并清理已失去资格却仍在放行的系统条目；手工录入的条目不受影响"
                  @click="syncApprovedWhitelist"
                >
                  <NsIcon name="refresh" /> 按账号重建
                </button>
                <button class="command-button secondary" type="button" :disabled="actionLoading" @click="exportBetaWhitelist">
                  <NsIcon name="download" /> 导出
                </button>
                <button class="command-button secondary" type="button" @click="openBetaWhitelistImport">
                  <NsIcon name="upload" /> 导入
                </button>
                <button class="command-button" type="button" @click="openBetaWhitelist()">
                  <NsIcon name="plus" /> 添加白名单
                </button>
              </div>
            </div>

            <div class="table-shell">
              <table class="data-table whitelist-table">
                <thead>
                  <tr>
                    <th>QQ</th>
                    <th>绑定游戏 ID</th>
                    <th>昵称 / 备注</th>
                    <th>资格状态</th>
                    <th>到期时间</th>
                    <th>创建信息</th>
                    <th class="action-column">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in betaWhitelist" :key="entry.id">
                    <td class="id-cell">{{ entry.qq }}</td>
                    <td>
                      <strong>{{ entry.mcId || '不限定' }}</strong>
                      <span class="cell-subtext">{{ entry.gameIdBound ? '精确绑定' : '任意游戏 ID' }}</span>
                    </td>
                    <td>
                      <strong>{{ entry.nickname || '未命名' }}</strong>
                      <span class="cell-subtext">{{ entry.remark || '无备注' }}</span>
                    </td>
                    <td>
                      <span :class="['status-tag', whitelistStatusClass(entry)]">{{ whitelistStatusLabel(entry) }}</span>
                    </td>
                    <td>{{ entry.expireAt || '永不过期' }}</td>
                    <td>
                      <span>{{ entry.createdBy || '系统' }}</span>
                      <span class="cell-subtext">{{ entry.createdAt || '—' }}</span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button class="icon-button" type="button" title="编辑白名单" aria-label="编辑白名单" @click="openBetaWhitelist(entry)">
                          <NsIcon name="edit" />
                        </button>
                        <button
                          class="icon-button"
                          :class="entry.status === 1 ? 'negative' : 'positive'"
                          type="button"
                          :title="entry.status === 1 ? '禁用资格' : '启用资格'"
                          :aria-label="entry.status === 1 ? '禁用资格' : '启用资格'"
                          :disabled="actionLoading"
                          @click="toggleBetaWhitelist(entry)"
                        >
                          <NsIcon :name="entry.status === 1 ? 'ban' : 'check'" />
                        </button>
                        <button
                          class="icon-button negative"
                          type="button"
                          title="删除白名单"
                          aria-label="删除白名单"
                          :disabled="actionLoading"
                          @click="removeBetaWhitelist(entry)"
                        >
                          <NsIcon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="!betaWhitelist.length" class="empty-row">未找到白名单条目</div>
            </div>
            <div class="pagination">
              <button class="icon-button" type="button" title="上一页" aria-label="上一页" :disabled="whitelistPage <= 1" @click="changeWhitelistPage(-1)">
                <NsIcon name="arrow-left" />
              </button>
              <span>第 {{ whitelistPage }} / {{ whitelistTotalPages }} 页 · 共 {{ whitelistTotal }} 条</span>
              <button class="icon-button" type="button" title="下一页" aria-label="下一页" :disabled="whitelistPage >= whitelistTotalPages" @click="changeWhitelistPage(1)">
                <NsIcon name="arrow-right" />
              </button>
            </div>
          </template>

          <template v-else>
            <div class="toolbar beta-toolbar">
              <div class="search-control">
                <NsIcon name="search" />
                <input
                  v-model="verifyLogSearch"
                  class="field-input"
                  placeholder="搜索 QQ、游戏 ID、IP 或原因"
                  @keyup.enter="searchBetaVerifyLogs"
                />
              </div>
              <select v-model="verifyLogResult" class="field-select" aria-label="校验结果筛选">
                <option value="">全部结果</option>
                <option value="pass">通过</option>
                <option value="reject">拒绝</option>
                <option value="error">异常</option>
              </select>
              <label class="check-control">
                <input v-model="showFullQq" type="checkbox" @change="searchBetaVerifyLogs" />
                <span>显示完整 QQ</span>
              </label>
              <span class="result-count">{{ verifyLogTotal }} 条记录</span>
            </div>

            <div class="table-shell">
              <table class="data-table verify-log-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>QQ / 游戏 ID</th>
                    <th>结果</th>
                    <th>命中方式</th>
                    <th>响应</th>
                    <th>来源</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in betaVerifyLogs" :key="log.id">
                    <td>{{ log.createdAt }}</td>
                    <td>
                      <strong>{{ log.qq || '—' }}</strong>
                      <span class="cell-subtext">{{ log.playerName || '未上报游戏 ID' }}</span>
                    </td>
                    <td><span :class="['status-tag', verifyLogStatusClass(log.result)]">{{ verifyLogStatusLabel(log.result) }}</span></td>
                    <td>{{ verifyLogMatchLabel(log.matchedBy) }}</td>
                    <td>
                      <span>{{ log.httpStatus }}</span>
                      <span class="cell-subtext">{{ log.costMs ?? 0 }} ms</span>
                    </td>
                    <td>
                      <span>{{ log.ip || '—' }}</span>
                      <span class="cell-subtext log-agent">{{ log.userAgent || '未知客户端' }}</span>
                    </td>
                    <td>{{ log.reason || '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="!betaVerifyLogs.length" class="empty-row">暂无校验日志</div>
            </div>
            <div class="pagination">
              <button class="icon-button" type="button" title="上一页" aria-label="上一页" :disabled="verifyLogPage <= 1" @click="changeVerifyLogPage(-1)">
                <NsIcon name="arrow-left" />
              </button>
              <span>第 {{ verifyLogPage }} / {{ verifyLogTotalPages }} 页 · 共 {{ verifyLogTotal }} 条</span>
              <button class="icon-button" type="button" title="下一页" aria-label="下一页" :disabled="verifyLogPage >= verifyLogTotalPages" @click="changeVerifyLogPage(1)">
                <NsIcon name="arrow-right" />
              </button>
            </div>
          </template>
        </section>

        <section v-else-if="activeTab === 'rooms'" class="workspace-section">
          <div class="toolbar">
            <div class="segmented-control" aria-label="房间状态">
              <button
                v-for="option in roomFilterOptions"
                :key="option.value"
                :class="{ active: roomFilter === option.value }"
                type="button"
                @click="roomFilter = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="table-shell">
            <table class="data-table room-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>房间</th>
                  <th>模式 / 地图</th>
                  <th>房主</th>
                  <th>人数</th>
                  <th>状态</th>
                  <th class="action-column">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="room in filteredRooms" :key="room.id">
                  <td class="id-cell">#{{ room.id }}</td>
                  <td><strong>{{ room.name }}</strong></td>
                  <td>
                    <span>{{ room.mode }}</span>
                    <span class="cell-subtext">{{ room.map }}</span>
                  </td>
                  <td>{{ room.host }}</td>
                  <td>{{ room.players }} / {{ room.maxPlayers }}</td>
                  <td>{{ room.status === 'waiting' ? '等待中' : room.status === 'closed' ? '已关闭' : '进行中' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="!filteredRooms.length" class="empty-row">暂无匹配的房间</div>
          </div>
        </section>

        <section v-else class="workspace-section">
          <div class="toolbar">
            <div class="search-control">
              <NsIcon name="search" />
              <input v-model="matchSearch" class="field-input" placeholder="搜索玩家、模式或地图" />
            </div>
            <span class="result-count">{{ filteredMatches.length }} 条记录</span>
          </div>

          <div class="table-shell">
            <table class="data-table match-table">
              <thead>
                <tr>
                  <th>结果</th>
                  <th>玩家</th>
                  <th>模式 / 地图</th>
                  <th>K / D / A</th>
                  <th>K/D</th>
                  <th>评分变化</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in filteredMatches" :key="match.id">
                  <td><span :class="['status-tag', match.win ? 'approved' : 'denied']">{{ match.win ? '胜利' : '失败' }}</span></td>
                  <td><strong>{{ match.username }}</strong></td>
                  <td>
                    <span>{{ match.mode }}</span>
                    <span class="cell-subtext">{{ match.mapName }}</span>
                  </td>
                  <td class="numeric-cell">{{ match.kills }} / {{ match.deaths }} / {{ match.assists }}</td>
                  <td class="numeric-cell">{{ match.kd }}</td>
                  <td><span :class="['score-change', match.scoreChange >= 0 ? 'positive' : 'negative']">{{ match.scoreChange >= 0 ? '+' : '' }}{{ match.scoreChange }}</span></td>
                  <td>{{ match.playedAt }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="!filteredMatches.length" class="empty-row">未找到匹配的对局</div>
          </div>
        </section>
      </template>
    </main>

    <div v-if="editingUser" class="modal-overlay" @click.self="closeEditUser">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
        <header class="modal-header">
          <div>
            <span class="section-kicker">PLAYER RECORD</span>
            <h2 id="edit-user-title">编辑玩家</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" aria-label="关闭" @click="closeEditUser">
            <NsIcon name="close-circle" />
          </button>
        </header>
        <div class="modal-player">
          <PlayerAvatar :player-id="editingUser.mcId || editingUser.username" :label="editingUser.username" :size="48" />
          <div>
            <strong>{{ editingUser.username }}</strong>
            <span>{{ editingUser.email }}</span>
          </div>
        </div>
        <form class="edit-form" @submit.prevent="saveUser">
          <label>
            <span>Minecraft ID（管理员可强制改写）</span>
            <input v-model="editForm.mcId" class="field-input" maxlength="16" placeholder="玩家注册后不可自改；清空表示解绑" />
          </label>
          <label>
            <span>QQ 号（管理员可强制改写）</span>
            <input v-model.trim="editForm.qq" class="field-input" maxlength="11" placeholder="玩家已绑定后不可自改；清空表示解绑" />
          </label>
          <label>
            <span>段位</span>
            <input v-model="editForm.rank" class="field-input" maxlength="32" required />
          </label>
          <label>
            <span>评分</span>
            <input v-model.number="editForm.score" class="field-input" type="number" min="0" max="100000" required />
          </label>
          <label>
            <span>内测资格</span>
            <select v-model="editForm.betaStatus" class="field-select">
              <option value="none">未获得</option>
              <option value="pending">审核中</option>
              <option value="approved">已通过</option>
              <option value="denied">已拒绝</option>
            </select>
            <span class="field-hint">
              <NsIcon name="warning" /> 改为「已通过」会自动写入客户端白名单；取消「已通过」会同时移除该玩家的白名单授权（手工录入的条目不受影响）
            </span>
          </label>
          <div class="modal-actions">
            <button class="command-button secondary" type="button" @click="closeEditUser">取消</button>
            <button class="command-button" type="submit" :disabled="actionLoading">
              <NsIcon name="save" /> 保存
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showBetaAdd" class="modal-overlay" @click.self="closeBetaAdd">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-beta-title">
        <header class="modal-header">
          <div>
            <span class="section-kicker">BETA ACCESS</span>
            <h2 id="add-beta-title">添加内测人员</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" aria-label="关闭" @click="closeBetaAdd">
            <NsIcon name="close-circle" />
          </button>
        </header>
        <form class="edit-form" @submit.prevent="submitBetaMember">
          <label class="full-field">
            <span>内测计划 *</span>
            <select v-model="betaAddForm.planId" class="field-select" required>
              <option value="" disabled>选择可分配的内测计划</option>
              <option v-for="plan in assignablePlans" :key="plan.id" :value="plan.id">
                {{ plan.phase }} · {{ plan.name }}（{{ plan.approvedCount }}/{{ plan.capacity }}）
              </option>
            </select>
          </label>
          <label class="full-field">
            <span>通知邮箱 *</span>
            <input
              v-model.trim="betaAddForm.email"
              class="field-input"
              type="email"
              maxlength="128"
              autocomplete="email"
              placeholder="player@example.com"
              required
            />
          </label>
          <label>
            <span>用户名</span>
            <input
              v-model.trim="betaAddForm.username"
              class="field-input"
              maxlength="32"
              placeholder="可选"
            />
          </label>
          <label>
            <span>Minecraft ID</span>
            <input
              v-model.trim="betaAddForm.mcId"
              class="field-input"
              maxlength="16"
              placeholder="可选"
            />
          </label>
          <label>
            <span>QQ 号</span>
            <input
              v-model.trim="betaAddForm.qq"
              class="field-input"
              maxlength="11"
              placeholder="留空则用账号已绑定的 QQ"
            />
          </label>
          <label class="full-field">
            <span>添加理由</span>
            <select v-model="betaAddForm.reason" class="field-select">
              <option value="manual">管理员添加</option>
              <option value="veteran">资深玩家</option>
              <option value="competitive">竞技经验</option>
              <option value="content">内容创作</option>
              <option value="tester">测试经验</option>
              <option value="other">其他</option>
            </select>
          </label>
          <div class="modal-actions">
            <button class="command-button secondary" type="button" @click="closeBetaAdd">取消</button>
            <button class="command-button" type="submit" :disabled="actionLoading">
              <NsIcon name="send" /> 添加并通知
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showBetaPlan" class="modal-overlay" @click.self="closeBetaPlan">
      <section class="modal-panel beta-plan-modal" role="dialog" aria-modal="true" aria-labelledby="beta-plan-title">
        <header class="modal-header">
          <div>
            <span class="section-kicker">BETA ROADMAP</span>
            <h2 id="beta-plan-title">{{ editingBetaPlan ? '编辑内测计划' : '新建内测计划' }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" aria-label="关闭" @click="closeBetaPlan">
            <NsIcon name="close-circle" />
          </button>
        </header>
        <form class="edit-form" @submit.prevent="submitBetaPlan">
          <label class="full-field">
            <span>计划名称 *</span>
            <input v-model.trim="betaPlanForm.name" class="field-input" maxlength="64" placeholder="例如：第二批竞技内测" required />
          </label>
          <label>
            <span>阶段 *</span>
            <input v-model.trim="betaPlanForm.phase" class="field-input" maxlength="16" placeholder="例如：P2" required />
          </label>
          <label>
            <span>计划名额 *</span>
            <input v-model.number="betaPlanForm.capacity" class="field-input" type="number" min="1" max="100000" required />
          </label>
          <label>
            <span>开始日期</span>
            <input v-model="betaPlanForm.startsOn" class="field-input" type="date" />
          </label>
          <label>
            <span>结束日期</span>
            <input v-model="betaPlanForm.endsOn" class="field-input" type="date" />
          </label>
          <label class="full-field">
            <span>计划说明</span>
            <textarea
              v-model.trim="betaPlanForm.description"
              class="field-input field-textarea"
              maxlength="500"
              rows="3"
              placeholder="本次内测的范围、内容和测试目标"
            ></textarea>
          </label>
          <label class="full-field">
            <span>可体验模式</span>
            <input v-model.trim="betaPlanForm.allowedModes" class="field-input" maxlength="128" placeholder="例如：团队死斗、据点争夺、夺旗战" />
          </label>
          <div class="modal-actions">
            <button class="command-button secondary" type="button" @click="closeBetaPlan">取消</button>
            <button class="command-button" type="submit" :disabled="actionLoading">
              <NsIcon name="save" /> {{ editingBetaPlan ? '保存计划' : '创建计划' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showBetaWhitelist" class="modal-overlay" @click.self="closeBetaWhitelist">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="beta-whitelist-title">
        <header class="modal-header">
          <div>
            <span class="section-kicker">CLIENT WHITELIST</span>
            <h2 id="beta-whitelist-title">{{ editingBetaWhitelist ? '编辑白名单' : '添加白名单' }}</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" aria-label="关闭" @click="closeBetaWhitelist">
            <NsIcon name="close-circle" />
          </button>
        </header>
        <form class="edit-form" @submit.prevent="submitBetaWhitelist">
          <label>
            <span>QQ 号 *</span>
            <input v-model.trim="betaWhitelistForm.qq" class="field-input" inputmode="numeric" maxlength="11" required />
          </label>
          <label>
            <span>绑定游戏 ID</span>
            <input v-model.trim="betaWhitelistForm.mcId" class="field-input" maxlength="16" placeholder="留空表示不限定" />
          </label>
          <label>
            <span>昵称</span>
            <input v-model.trim="betaWhitelistForm.nickname" class="field-input" maxlength="64" />
          </label>
          <label>
            <span>资格状态</span>
            <select v-model.number="betaWhitelistForm.status" class="field-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </label>
          <label class="full-field">
            <span>备注</span>
            <input v-model.trim="betaWhitelistForm.remark" class="field-input" maxlength="255" />
          </label>
          <label class="full-field">
            <span>到期时间</span>
            <input v-model="betaWhitelistForm.expireAt" class="field-input" type="datetime-local" />
          </label>
          <div class="modal-actions">
            <button class="command-button secondary" type="button" @click="closeBetaWhitelist">取消</button>
            <button class="command-button" type="submit" :disabled="actionLoading">
              <NsIcon name="save" /> 保存
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showBetaWhitelistImport" class="modal-overlay" @click.self="closeBetaWhitelistImport">
      <section class="modal-panel beta-import-modal" role="dialog" aria-modal="true" aria-labelledby="beta-import-title">
        <header class="modal-header">
          <div>
            <span class="section-kicker">CSV IMPORT</span>
            <h2 id="beta-import-title">批量导入白名单</h2>
          </div>
          <button class="icon-button" type="button" title="关闭" aria-label="关闭" @click="closeBetaWhitelistImport">
            <NsIcon name="close-circle" />
          </button>
        </header>
        <form class="edit-form" @submit.prevent="submitBetaWhitelistImport">
          <label class="full-field">
            <span>CSV 文件</span>
            <input class="field-input file-input" type="file" accept=".csv,.txt,text/csv,text/plain" @change="readBetaWhitelistFile" />
          </label>
          <label class="full-field">
            <span>导入内容</span>
            <textarea
              v-model="betaWhitelistImportText"
              class="field-input field-textarea import-textarea"
              rows="10"
              placeholder="qq,gameId,nickname,remark,expireAt&#10;123456789,Steve,明明,一期内测,2026-12-31"
              required
            ></textarea>
          </label>
          <label class="full-field check-control">
            <input v-model="betaWhitelistReplace" type="checkbox" />
            <span>导入前清空现有白名单</span>
          </label>
          <div v-if="betaWhitelistImportResult" class="import-result full-field">
            <strong>{{ betaWhitelistImportSummary }}</strong>
            <div v-if="betaWhitelistImportResult.errors?.length" class="import-errors">
              <span v-for="message in betaWhitelistImportResult.errors" :key="message">{{ message }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="command-button secondary" type="button" @click="closeBetaWhitelistImport">关闭</button>
            <button class="command-button" type="submit" :disabled="actionLoading || !betaWhitelistImportText.trim()">
              <NsIcon name="upload" /> 开始导入
            </button>
          </div>
        </form>
      </section>
    </div>

    <ConfirmDialog
      :open="confirmState.open"
      :title="confirmState.title"
      :message="confirmState.message"
      :details="confirmState.details"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :confirm-icon="confirmState.confirmIcon"
      :tone="confirmState.tone"
      :busy="actionLoading"
      kicker="ADMIN ACTION"
      @confirm="resolveConfirm(true)"
      @cancel="resolveConfirm(false)"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  addAdminBetaMember,
  createAdminBetaPlan,
  createAdminBetaWhitelist,
  decideAdminBetaApplication,
  deleteAdminBetaWhitelist,
  exportAdminBetaWhitelist,
  getAdminBetaVerifyLogs,
  getAdminBetaApplications,
  getAdminBetaWhitelist,
  getAdminMatches,
  getAdminOverview,
  getAdminBetaPlans,
  getAdminRooms,
  getAdminUsers,
  grantAdminUser,
  importAdminBetaWhitelistCsv,
  revokeAdminUser,
  syncAdminBetaWhitelistAccounts,
  updateAdminBetaPlan,
  updateAdminBetaPlanStatus,
  updateAdminBetaWhitelist,
  updateAdminUser
} from '../api/admin'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useAuth } from '../stores/auth'

const { currentUser } = useAuth()

const tabs = [
  { key: 'overview', label: '总览', icon: 'dashboard' },
  { key: 'users', label: '玩家管理', icon: 'team' },
  { key: 'beta', label: '内测管理', icon: 'key' },
  { key: 'rooms', label: '房间监管', icon: 'home' },
  { key: 'matches', label: '对局记录', icon: 'activity' }
]
const betaFilterOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'denied', label: '已拒绝' },
  { value: 'all', label: '全部' }
]
const betaModeOptions = [
  { value: 'members', label: '成员管理' },
  { value: 'plans', label: '计划管理' },
  { value: 'whitelist', label: '客户端白名单' },
  { value: 'logs', label: '校验日志' }
]
const adminLoadSections = [
  { label: '总览', load: () => loadOverview() },
  { label: '玩家', load: () => loadUsers() },
  { label: '内测申请', load: () => loadBetaApplications() },
  { label: '内测计划', load: () => loadBetaPlans() },
  { label: '客户端白名单', load: () => loadBetaWhitelist() },
  { label: '校验日志', load: () => loadBetaVerifyLogs() },
  { label: '房间', load: () => loadRooms() },
  { label: '对局记录', load: () => loadMatches() }
]
const roomFilterOptions = [
  { value: '', label: '全部' },
  { value: 'waiting', label: '等待中' },
  { value: 'playing', label: '进行中' },
  { value: 'closed', label: '已关闭' }
]

const activeTab = ref('overview')
const loading = ref(true)
const actionLoading = ref(false)
const error = ref('')
const notice = ref('')

/**
 * 站内确认弹窗状态。把 ConfirmDialog 包成 Promise，调用处就能写成
 * `if (!(await askConfirm({...}))) return`，与原来的 window.confirm 用法一一对应。
 */
const confirmState = reactive({
  open: false,
  title: '请确认操作',
  message: '',
  details: [],
  confirmText: '确定',
  cancelText: '取消',
  confirmIcon: 'check',
  tone: 'default',
  resolve: null
})

function askConfirm(options = {}) {
  return new Promise((resolve) => {
    confirmState.open = true
    confirmState.title = options.title || '请确认操作'
    confirmState.message = options.message || ''
    confirmState.details = options.details || []
    confirmState.confirmText = options.confirmText || '确定'
    confirmState.cancelText = options.cancelText || '取消'
    confirmState.confirmIcon = options.confirmIcon || 'check'
    confirmState.tone = options.tone || 'default'
    confirmState.resolve = resolve
  })
}

function resolveConfirm(accepted) {
  const pending = confirmState.resolve
  confirmState.open = false
  confirmState.resolve = null
  if (pending) pending(accepted)
}
const overview = ref({})
const users = ref([])
const betaApplications = ref([])
const betaPlans = ref([])
const betaWhitelist = ref([])
const betaVerifyLogs = ref([])
const rooms = ref([])
const matches = ref([])
const userSearch = ref('')
const userBetaFilter = ref('')
const betaMode = ref('members')
const betaFilter = ref('pending')
const whitelistSearch = ref('')
const whitelistStatus = ref('')
const whitelistPage = ref(1)
const whitelistPageSize = 20
const whitelistTotal = ref(0)
const verifyLogSearch = ref('')
const verifyLogResult = ref('')
const verifyLogPage = ref(1)
const verifyLogPageSize = 20
const verifyLogTotal = ref(0)
const showFullQq = ref(false)
const roomFilter = ref('')
const matchSearch = ref('')
const editingUser = ref(null)
const showBetaAdd = ref(false)
const showBetaPlan = ref(false)
const showBetaWhitelist = ref(false)
const showBetaWhitelistImport = ref(false)
const editingBetaPlan = ref(null)
const editingBetaWhitelist = ref(null)
const betaWhitelistImportText = ref('')
const betaWhitelistReplace = ref(false)
const betaWhitelistImportResult = ref(null)
const editForm = reactive({ mcId: '', qq: '', rank: '', score: 1000, betaStatus: 'none' })
const betaAddForm = reactive({ email: '', username: '', mcId: '', qq: '', reason: 'manual', planId: '' })
const betaPlanForm = reactive({
  name: '',
  phase: '',
  description: '',
  startsOn: '',
  endsOn: '',
  capacity: 100,
  allowedModes: ''
})
const betaWhitelistForm = reactive({
  qq: '',
  mcId: '',
  nickname: '',
  remark: '',
  status: 1,
  expireAt: ''
})

const activeTabMeta = computed(() => tabs.find(tab => tab.key === activeTab.value) || tabs[0])
const metricItems = computed(() => [
  { label: '注册玩家', value: overview.value.totalUsers || 0, icon: 'team' },
  { label: '在线玩家', value: overview.value.onlinePlayers || 0, icon: 'activity' },
  { label: '待审申请', value: overview.value.pendingBetaApplications || 0, icon: 'key' },
  { label: '活跃房间', value: overview.value.activeRooms || 0, icon: 'gamepad' }
])
const pendingApplications = computed(() => betaApplications.value.filter(item => item.status === 'pending').slice(0, 5))
const assignablePlans = computed(() => betaPlans.value.filter(plan =>
  plan.status !== 'completed' && Number(plan.approvedCount) < Number(plan.capacity)
))
const whitelistTotalPages = computed(() => Math.max(1, Math.ceil(whitelistTotal.value / whitelistPageSize)))
const verifyLogTotalPages = computed(() => Math.max(1, Math.ceil(verifyLogTotal.value / verifyLogPageSize)))
const betaWhitelistImportSummary = computed(() => {
  const result = betaWhitelistImportResult.value
  return result
    ? `新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}，失败 ${result.failed}`
    : ''
})
const filteredRooms = computed(() => roomFilter.value
  ? rooms.value.filter(room => room.status === roomFilter.value)
  : rooms.value
)
const filteredMatches = computed(() => {
  const keyword = matchSearch.value.trim().toLowerCase()
  if (!keyword) return matches.value
  return matches.value.filter(match =>
    [match.username, match.mode, match.mapName].some(value => String(value || '').toLowerCase().includes(keyword))
  )
})

async function refreshAll() {
  loading.value = true
  error.value = ''
  notice.value = ''
  const results = await Promise.allSettled(adminLoadSections.map(async section => {
    try {
      await section.load()
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      error.adminSection = section.label
      throw error
    }
  }))
  const failed = results.filter(result => result.status === 'rejected')
  if (failed.length) {
    if (failed.every(result => result.reason?.response?.status === 403)) {
      error.value = '管理后台权限校验失败（403）：当前登录账号没有管理员权限，请确认管理员配置后重新登录'
      console.error('Admin authorization failed:', failed.map(result => result.reason))
      loading.value = false
      return
    }
    const details = failed.map(result => {
      const reason = result.reason || {}
      const message = reason.userMessage
        || reason.response?.data?.message
        || reason.message
        || '未知错误'
      return `${reason.adminSection || '未知模块'}：${message}`
    })
    error.value = `管理数据加载失败（${details.join('；')}）`
    console.error('Admin data load failed:', failed.map(result => result.reason))
  }
  loading.value = false
}

async function loadOverview() {
  const res = await getAdminOverview()
  overview.value = res.data || {}
}

async function loadUsers() {
  const res = await getAdminUsers({ query: userSearch.value.trim(), betaStatus: userBetaFilter.value })
  users.value = res.data || []
}

async function loadBetaApplications() {
  const res = await getAdminBetaApplications(betaFilter.value)
  betaApplications.value = res.data || []
}

async function loadBetaPlans() {
  const res = await getAdminBetaPlans()
  betaPlans.value = res.data || []
}

async function loadBetaWhitelist() {
  const params = {
    page: whitelistPage.value,
    size: whitelistPageSize,
    keyword: whitelistSearch.value.trim()
  }
  if (whitelistStatus.value !== '') params.status = whitelistStatus.value
  const res = await getAdminBetaWhitelist(params)
  const data = res.data || {}
  betaWhitelist.value = data.list || []
  whitelistTotal.value = Number(data.total || 0)
}

async function loadBetaVerifyLogs() {
  const res = await getAdminBetaVerifyLogs({
    page: verifyLogPage.value,
    size: verifyLogPageSize,
    keyword: verifyLogSearch.value.trim(),
    result: verifyLogResult.value,
    showQq: showFullQq.value
  })
  const data = res.data || {}
  betaVerifyLogs.value = data.list || []
  verifyLogTotal.value = Number(data.total || 0)
}

async function loadRooms() {
  const res = await getAdminRooms()
  rooms.value = res.data || []
}

async function loadMatches() {
  const res = await getAdminMatches()
  matches.value = res.data || []
}

function openEditUser(user) {
  editingUser.value = user
  editForm.mcId = user.mcId || ''
  editForm.qq = user.qq || ''
  editForm.rank = user.rank || ''
  editForm.score = user.score ?? 1000
  editForm.betaStatus = user.betaStatus || 'none'
}

function closeEditUser() {
  editingUser.value = null
}

async function saveUser() {
  if (!editingUser.value) return
  actionLoading.value = true
  error.value = ''
  try {
    const res = await updateAdminUser(editingUser.value.id, { ...editForm })
    const index = users.value.findIndex(user => user.id === editingUser.value.id)
    if (index >= 0) users.value[index] = res.data
    showNotice('玩家资料已更新')
    closeEditUser()
  } catch (e) {
    error.value = e.response?.data?.message || '玩家资料更新失败'
  } finally {
    actionLoading.value = false
  }
}

async function changeAdminRole(user) {
  actionLoading.value = true
  error.value = ''
  try {
    const response = user.role === 'admin'
      ? await revokeAdminUser(user.id)
      : await grantAdminUser(user.id)
    showNotice(response.message || '管理员身份已更新')
    await Promise.all([loadUsers(), loadOverview()])
  } catch (e) {
    error.value = e.response?.data?.message || '管理员身份更新失败'
  } finally {
    actionLoading.value = false
  }
}

async function decideBeta(application, status) {
  actionLoading.value = true
  error.value = ''
  try {
    const res = await decideAdminBetaApplication(application.id, status)
    showNotice(res.message || '审核结果已保存')
    await Promise.all([loadBetaApplications(), loadBetaPlans(), loadOverview(), loadUsers()])
  } catch (e) {
    error.value = e.response?.data?.message || '审核操作失败'
  } finally {
    actionLoading.value = false
  }
}

function openBetaAdd() {
  betaAddForm.email = ''
  betaAddForm.username = ''
  betaAddForm.mcId = ''
  betaAddForm.qq = ''
  betaAddForm.reason = 'manual'
  betaAddForm.planId = assignablePlans.value[0]?.id || ''
  showBetaAdd.value = true
}

function closeBetaAdd() {
  showBetaAdd.value = false
}

async function submitBetaMember() {
  if (!betaAddForm.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(betaAddForm.email)) {
    error.value = '请输入有效的通知邮箱'
    return
  }
  if (betaAddForm.mcId && !/^[a-zA-Z0-9_]{3,16}$/.test(betaAddForm.mcId)) {
    error.value = 'Minecraft ID 仅允许 3-16 位字母、数字和下划线'
    return
  }
  if (betaAddForm.qq && !/^[1-9]\d{4,10}$/.test(betaAddForm.qq)) {
    error.value = 'QQ 号应为 5-11 位数字'
    return
  }
  if (!betaAddForm.planId) {
    error.value = '请选择一个可分配的内测计划'
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    const res = await addAdminBetaMember({ ...betaAddForm, planId: Number(betaAddForm.planId) })
    showNotice(res.message || '内测人员已添加')
    closeBetaAdd()
    betaFilter.value = 'approved'
    await Promise.all([loadBetaApplications(), loadBetaPlans(), loadOverview(), loadUsers()])
  } catch (e) {
    error.value = e.response?.data?.message || '添加内测人员失败'
  } finally {
    actionLoading.value = false
  }
}

function openBetaPlan(plan = null) {
  editingBetaPlan.value = plan
  betaPlanForm.name = plan?.name || ''
  betaPlanForm.phase = plan?.phase || ''
  betaPlanForm.description = plan?.description || ''
  betaPlanForm.startsOn = plan?.startsOn || ''
  betaPlanForm.endsOn = plan?.endsOn || ''
  betaPlanForm.capacity = plan?.capacity || 100
  betaPlanForm.allowedModes = plan?.allowedModes || ''
  showBetaPlan.value = true
}

function closeBetaPlan() {
  showBetaPlan.value = false
  editingBetaPlan.value = null
}

async function submitBetaPlan() {
  if (!betaPlanForm.name || !betaPlanForm.phase) {
    error.value = '请填写计划名称和阶段'
    return
  }
  if (!Number.isInteger(Number(betaPlanForm.capacity)) || Number(betaPlanForm.capacity) < 1) {
    error.value = '计划名额必须为大于 0 的整数'
    return
  }
  if (betaPlanForm.startsOn && betaPlanForm.endsOn && betaPlanForm.endsOn < betaPlanForm.startsOn) {
    error.value = '结束日期不能早于开始日期'
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    const payload = {
      name: betaPlanForm.name,
      phase: betaPlanForm.phase,
      description: betaPlanForm.description,
      startsOn: betaPlanForm.startsOn || null,
      endsOn: betaPlanForm.endsOn || null,
      capacity: Number(betaPlanForm.capacity),
      allowedModes: betaPlanForm.allowedModes
    }
    const res = editingBetaPlan.value
      ? await updateAdminBetaPlan(editingBetaPlan.value.id, payload)
      : await createAdminBetaPlan(payload)
    showNotice(res.message || (editingBetaPlan.value ? '内测计划已更新' : '内测计划已创建'))
    closeBetaPlan()
    await Promise.all([loadBetaPlans(), loadBetaApplications()])
  } catch (e) {
    error.value = e.response?.data?.message || '内测计划保存失败'
  } finally {
    actionLoading.value = false
  }
}

async function changeBetaPlanStatus(plan, status) {
  actionLoading.value = true
  error.value = ''
  try {
    const res = await updateAdminBetaPlanStatus(plan.id, status)
    showNotice(res.message || '计划状态已更新')
    await Promise.all([loadBetaPlans(), loadBetaApplications(), loadOverview()])
  } catch (e) {
    error.value = e.response?.data?.message || '计划状态更新失败'
    await loadBetaPlans().catch(() => {})
  } finally {
    actionLoading.value = false
  }
}

function searchBetaWhitelist() {
  whitelistPage.value = 1
  loadBetaWhitelist().catch(handleBetaWhitelistError)
}

function changeWhitelistPage(delta) {
  const next = whitelistPage.value + delta
  if (next < 1 || next > whitelistTotalPages.value) return
  whitelistPage.value = next
  loadBetaWhitelist().catch(handleBetaWhitelistError)
}

function openBetaWhitelist(entry = null) {
  editingBetaWhitelist.value = entry
  betaWhitelistForm.qq = entry?.qq || ''
  betaWhitelistForm.mcId = entry?.mcId || ''
  betaWhitelistForm.nickname = entry?.nickname || ''
  betaWhitelistForm.remark = entry?.remark || ''
  betaWhitelistForm.status = entry?.status ?? 1
  betaWhitelistForm.expireAt = entry?.expireAt ? entry.expireAt.replace(' ', 'T') : ''
  showBetaWhitelist.value = true
}

function closeBetaWhitelist() {
  showBetaWhitelist.value = false
  editingBetaWhitelist.value = null
}

async function submitBetaWhitelist() {
  if (!/^[1-9]\d{4,10}$/.test(betaWhitelistForm.qq)) {
    error.value = 'QQ 号应为 5-11 位数字'
    return
  }
  if (betaWhitelistForm.mcId && !/^[a-zA-Z0-9_]{3,16}$/.test(betaWhitelistForm.mcId)) {
    error.value = '游戏 ID 仅允许 3-16 位字母、数字和下划线'
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    const payload = {
      qq: betaWhitelistForm.qq,
      mcId: betaWhitelistForm.mcId,
      nickname: betaWhitelistForm.nickname,
      remark: betaWhitelistForm.remark,
      status: Number(betaWhitelistForm.status),
      expireAt: betaWhitelistForm.expireAt
    }
    const res = editingBetaWhitelist.value
      ? await updateAdminBetaWhitelist(editingBetaWhitelist.value.id, payload)
      : await createAdminBetaWhitelist(payload)
    showNotice(res.message || '白名单已保存')
    closeBetaWhitelist()
    await loadBetaWhitelist()
  } catch (e) {
    handleBetaWhitelistError(e)
  } finally {
    actionLoading.value = false
  }
}

async function toggleBetaWhitelist(entry) {
  actionLoading.value = true
  error.value = ''
  try {
    const res = await updateAdminBetaWhitelist(entry.id, { status: entry.status === 1 ? 0 : 1 })
    showNotice(res.message || '白名单状态已更新')
    await loadBetaWhitelist()
  } catch (e) {
    handleBetaWhitelistError(e)
  } finally {
    actionLoading.value = false
  }
}

async function removeBetaWhitelist(entry) {
  const accepted = await askConfirm({
    title: '删除白名单条目',
    message: `确认删除 QQ ${entry.qq} 的白名单资格？`,
    details: ['删除后该玩家将无法通过客户端内测校验；此操作不可撤销。'],
    confirmText: '删除',
    confirmIcon: 'trash',
    tone: 'danger'
  })
  if (!accepted) return
  actionLoading.value = true
  error.value = ''
  try {
    const res = await deleteAdminBetaWhitelist(entry.id)
    showNotice(res.message || '白名单条目已删除')
    if (betaWhitelist.value.length === 1 && whitelistPage.value > 1) {
      whitelistPage.value -= 1
    }
    await loadBetaWhitelist()
  } catch (e) {
    handleBetaWhitelistError(e)
  } finally {
    actionLoading.value = false
  }
}

async function syncApprovedWhitelist() {
  const accepted = await askConfirm({
    title: '按账号状态重建白名单',
    message: '会为「已通过」的玩家补齐 / 更新白名单条目，并清理已失去资格却仍在放行的系统条目。',
    details: ['手工录入的条目不会被删除或修改。', '重建只依据账号的内测资格状态，不影响账号本身。'],
    confirmText: '开始重建',
    confirmIcon: 'refresh'
  })
  if (!accepted) return
  actionLoading.value = true
  error.value = ''
  try {
    const res = await syncAdminBetaWhitelistAccounts()
    const data = res.data || {}
    showNotice(res.message || '白名单对账完成')
    if (data.problems?.length) {
      error.value = `以下账号未能同步：${data.problems.join('；')}`
    }
    await Promise.all([loadBetaWhitelist(), loadUsers()])
  } catch (e) {
    handleBetaWhitelistError(e, '白名单对账失败')
  } finally {
    actionLoading.value = false
  }
}

async function exportBetaWhitelist() {
  actionLoading.value = true
  error.value = ''
  try {
    const blob = await exportAdminBetaWhitelist()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `northstar-beta-whitelist-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showNotice('白名单 CSV 已导出')
  } catch (e) {
    handleBetaWhitelistError(e, '白名单导出失败')
  } finally {
    actionLoading.value = false
  }
}

function openBetaWhitelistImport() {
  betaWhitelistImportText.value = ''
  betaWhitelistReplace.value = false
  betaWhitelistImportResult.value = null
  showBetaWhitelistImport.value = true
}

function closeBetaWhitelistImport() {
  showBetaWhitelistImport.value = false
}

async function readBetaWhitelistFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  betaWhitelistImportText.value = await file.text()
}

async function submitBetaWhitelistImport() {
  if (!betaWhitelistImportText.value.trim()) return
  if (betaWhitelistReplace.value) {
    const accepted = await askConfirm({
      title: '覆盖导入白名单',
      message: '当前为「覆盖」模式：导入前会先清空全部现有白名单条目，再写入文件内容。',
      details: ['手工录入的条目会一并被清空，且不可撤销。', '如只需追加，请关闭「覆盖」后重新提交。'],
      confirmText: '清空并导入',
      tone: 'danger'
    })
    if (!accepted) return
  }
  actionLoading.value = true
  error.value = ''
  betaWhitelistImportResult.value = null
  try {
    const res = await importAdminBetaWhitelistCsv(betaWhitelistImportText.value, betaWhitelistReplace.value)
    betaWhitelistImportResult.value = res.data || {}
    showNotice(res.message || '白名单导入完成')
    whitelistPage.value = 1
    await loadBetaWhitelist()
  } catch (e) {
    handleBetaWhitelistError(e, '白名单导入失败')
  } finally {
    actionLoading.value = false
  }
}

function searchBetaVerifyLogs() {
  verifyLogPage.value = 1
  loadBetaVerifyLogs().catch(handleBetaVerifyLogError)
}

function changeVerifyLogPage(delta) {
  const next = verifyLogPage.value + delta
  if (next < 1 || next > verifyLogTotalPages.value) return
  verifyLogPage.value = next
  loadBetaVerifyLogs().catch(handleBetaVerifyLogError)
}

function handleBetaWhitelistError(e, fallback = '白名单操作失败') {
  error.value = e.response?.data?.message || e.userMessage || fallback
}

function handleBetaVerifyLogError(e) {
  error.value = e.response?.data?.message || e.userMessage || '校验日志加载失败'
}

function showNotice(message) {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 2600)
}

function betaStatusLabel(status) {
  return { none: '未获得', pending: '审核中', approved: '已通过', denied: '已拒绝' }[status] || status
}

function betaStatusClass(status) {
  return { none: 'neutral', pending: 'pending', approved: 'approved', denied: 'denied' }[status] || 'neutral'
}

function reasonLabel(reason) {
  return {
    manual: '管理员添加',
    veteran: '资深玩家',
    competitive: '竞技经验',
    content: '内容创作',
    tester: '测试经验',
    other: '其他'
  }[reason] || reason || '未填写'
}

function whitelistStatusLabel(entry) {
  if (entry.status !== 1) return '已禁用'
  return entry.active ? '可用' : '已过期'
}

function whitelistStatusClass(entry) {
  if (entry.status !== 1) return 'denied'
  return entry.active ? 'approved' : 'pending'
}

function verifyLogStatusLabel(result) {
  return { pass: '通过', reject: '拒绝', error: '异常' }[result] || result || '未知'
}

function verifyLogStatusClass(result) {
  return { pass: 'approved', reject: 'denied', error: 'pending' }[result] || 'neutral'
}

function verifyLogMatchLabel(matchedBy) {
  return { bound: '精确绑定', unbound: '不限定游戏 ID' }[matchedBy] || '—'
}

function planLabel(planId) {
  const plan = betaPlans.value.find(item => item.id === planId)
  return plan ? plan.phase + ' · ' + plan.name : '未关联'
}

function formatDate(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

watch(userBetaFilter, loadUsers)
watch(betaFilter, loadBetaApplications)
watch(whitelistStatus, searchBetaWhitelist)
watch(verifyLogResult, searchBetaVerifyLogs)
onMounted(refreshAll)
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 70px);
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  background: var(--bg-secondary);
}

.admin-sidebar {
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  background: #0d100d;
  padding: 24px 16px 18px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px 18px;
  border-bottom: 1px solid var(--border-color);
  color: var(--accent-primary);
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 20px;
}

.nav-button {
  width: 100%;
  min-height: 44px;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.nav-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.nav-button.active {
  color: var(--accent-primary);
  border-color: var(--border-hover);
  background: rgba(255, 140, 0, 0.08);
}

.nav-count {
  min-width: 22px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-red);
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
}

.sidebar-account {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  padding: 18px 8px 0;
}

.account-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  white-space: nowrap;
}

.account-copy span {
  color: var(--text-muted);
  font-size: 9px;
  letter-spacing: 0;
}

.admin-workspace {
  min-width: 0;
  padding: 34px 38px 72px;
}

.workspace-header {
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.workspace-kicker,
.section-kicker {
  color: var(--accent-primary);
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
}

.workspace-header h1 {
  margin-top: 6px;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  font-size: 25px;
  letter-spacing: 0;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-button:hover:not(:disabled) {
  border-color: var(--border-hover);
  color: var(--accent-primary);
  background: rgba(255, 140, 0, 0.07);
}

.icon-button.positive:hover:not(:disabled) {
  border-color: var(--accent-green);
  color: var(--accent-green);
  background: rgba(76, 175, 80, 0.08);
}

.icon-button.negative:hover:not(:disabled) {
  border-color: var(--accent-red);
  color: var(--accent-red);
  background: rgba(244, 67, 54, 0.08);
}

.icon-button:disabled,
.command-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.notice-bar {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid;
  margin-bottom: 18px;
  padding: 8px 14px;
  font-size: 13px;
}

.notice-bar.success {
  color: var(--accent-green);
  border-color: rgba(76, 175, 80, 0.35);
  background: rgba(76, 175, 80, 0.08);
}

.notice-bar.error {
  color: var(--accent-red);
  border-color: rgba(244, 67, 54, 0.35);
  background: rgba(244, 67, 54, 0.08);
}

.notice-bar button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.admin-state {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  color: var(--text-muted);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 34px;
}

.metric-card {
  min-height: 132px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  padding: 22px;
}

.metric-icon {
  grid-row: 1 / 3;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 140, 0, 0.08);
  color: var(--accent-primary);
}

.metric-card strong {
  align-self: end;
  font-family: 'Orbitron', sans-serif;
  color: var(--text-primary);
  font-size: 25px;
  letter-spacing: 0;
}

.metric-card > span {
  align-self: start;
  color: var(--text-muted);
  font-size: 12px;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 34px;
}

.data-section {
  min-width: 0;
}

.section-header {
  min-height: 54px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 12px;
}

.section-header h2 {
  margin-top: 5px;
  font-size: 18px;
  letter-spacing: 0;
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.text-button:hover {
  color: var(--accent-primary);
}

.activity-list {
  border-top: 1px solid var(--border-color);
}

.activity-row {
  min-height: 70px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.result-mark {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 800;
}

.result-mark.win {
  color: var(--accent-green);
  border: 1px solid rgba(76, 175, 80, 0.35);
}

.result-mark.loss {
  color: var(--accent-red);
  border: 1px solid rgba(244, 67, 54, 0.35);
}

.activity-copy,
.activity-score {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.activity-copy strong {
  font-size: 13px;
}

.activity-copy span,
.activity-score span {
  color: var(--text-muted);
  font-size: 11px;
}

.activity-score {
  text-align: right;
}

.activity-score strong {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 0;
}

.toolbar {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-control {
  min-width: 280px;
  max-width: 440px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.025);
  padding: 0 13px;
}

.search-control:focus-within {
  border-color: var(--accent-primary);
}

.search-control .ns-icon {
  color: var(--text-muted);
}

.field-input,
.field-select,
.status-select {
  min-height: 42px;
  border: 1px solid var(--border-color);
  background: #111411;
  color: var(--text-primary);
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.field-input:focus,
.field-select:focus,
.status-select:focus {
  border-color: var(--accent-primary);
}

.search-control .field-input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding-left: 0;
}

.field-select {
  width: 180px;
}

.command-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--accent-primary);
  background: var(--accent-primary);
  color: #080808;
  padding: 0 18px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.command-button:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.command-button.secondary {
  border-color: var(--border-color);
  background: transparent;
  color: var(--text-secondary);
}

.command-button.danger {
  border-color: var(--accent-red);
  background: var(--accent-red);
  color: #fff;
}

.segmented-control {
  display: inline-flex;
  border: 1px solid var(--border-color);
}

.segmented-control button {
  min-width: 88px;
  min-height: 38px;
  border: 0;
  border-right: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.segmented-control button:last-child {
  border-right: 0;
}

.segmented-control button.active {
  background: rgba(255, 140, 0, 0.1);
  color: var(--accent-primary);
}

.result-count {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 12px;
}

.table-shell {
  min-width: 0;
  overflow-x: auto;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.data-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}

.user-table { min-width: 1040px; }
.beta-table { min-width: 1120px; }
.beta-plan-table { min-width: 1120px; }
.whitelist-table { min-width: 1180px; }
.verify-log-table { min-width: 1160px; }
.room-table { min-width: 940px; }
.match-table { min-width: 920px; }

.data-table th {
  height: 42px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 800;
  text-align: left;
  letter-spacing: 0;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
  padding: 0 14px;
  white-space: nowrap;
}

.data-table td {
  height: 66px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.045);
  padding: 10px 14px;
  color: var(--text-secondary);
  font-size: 12px;
}

.data-table tbody tr:last-child td {
  border-bottom: 0;
}

.data-table tbody tr:hover td {
  background: rgba(255, 140, 0, 0.025);
}

.data-table strong {
  display: block;
  color: var(--text-primary);
  font-size: 12px;
}

.cell-subtext {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 10px;
}

.action-column {
  width: 92px;
  text-align: right !important;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 170px;
}

.score-value,
.numeric-cell {
  color: var(--accent-primary) !important;
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0;
}

.score-value {
  display: block;
  margin-top: 5px;
  font-size: 11px;
}

.status-tag,
.role-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.status-tag.neutral {
  color: var(--text-muted);
  border-color: var(--border-color);
}

.status-tag.pending {
  color: #ffc107;
  border-color: rgba(255, 193, 7, 0.35);
}

.status-tag.approved {
  color: var(--accent-green);
  border-color: rgba(76, 175, 80, 0.35);
}

.status-tag.denied {
  color: var(--accent-red);
  border-color: rgba(244, 67, 54, 0.35);
}

.role-tag {
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.role-tag.admin {
  color: var(--accent-blue);
  border-color: rgba(33, 150, 243, 0.35);
}

.capacity-label {
  margin-left: auto;
  color: var(--text-secondary);
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 0;
  white-space: nowrap;
}

.id-cell {
  color: var(--text-muted) !important;
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0;
}

.status-select {
  width: 112px;
  min-height: 34px;
  font-size: 11px;
}

.plan-phase {
  color: var(--accent-primary);
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.plan-description {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted-value {
  color: var(--text-muted);
}

.score-change.positive {
  color: var(--accent-green);
}

.score-change.negative {
  color: var(--accent-red);
}

.empty-row {
  min-height: 116px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.76);
  padding: 20px;
}

.modal-panel {
  width: min(520px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  border: 1px solid var(--border-hover);
  background: var(--bg-card);
  padding: 26px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 18px;
}

.modal-header h2 {
  margin-top: 5px;
  font-size: 20px;
  letter-spacing: 0;
}

.modal-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.modal-player div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.modal-player strong {
  font-size: 14px;
}

.modal-player span {
  color: var(--text-muted);
  font-size: 11px;
}

.edit-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.edit-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 11px;
}

.edit-form .full-field {
  grid-column: 1 / -1;
}

.edit-form .field-input,
.edit-form .field-select {
  width: 100%;
}

.field-textarea {
  min-height: 88px;
  padding-top: 11px;
  resize: vertical;
}

.beta-toolbar .command-button {
  margin-left: auto;
}

.beta-mode-toolbar .command-button {
  margin-left: auto;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.toolbar-actions .command-button {
  margin-left: 0;
}

.check-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.check-control input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-primary);
}

.pagination {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: var(--text-muted);
  font-size: 11px;
}

.pagination .icon-button {
  width: 32px;
  height: 32px;
  flex-basis: 32px;
}

.file-input {
  padding: 9px 12px;
}

.import-textarea {
  min-height: 210px;
  font-family: Consolas, monospace;
  line-height: 1.5;
}

.import-result {
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.025);
  padding: 14px;
  color: var(--text-secondary);
  font-size: 12px;
}

.import-result strong {
  color: var(--text-primary);
}

.import-errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 10px;
  color: var(--accent-red);
}

.log-agent {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  margin-top: 4px;
  padding-top: 18px;
}

.confirm-panel {
  max-width: 420px;
  text-align: center;
}

.confirm-icon {
  color: var(--accent-red);
  margin-bottom: 16px;
}

.confirm-panel h2 {
  font-size: 19px;
}

.confirm-panel p {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .admin-page {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border-color);
    padding: 12px 16px;
  }

  .sidebar-title,
  .sidebar-account {
    display: none;
  }

  .admin-nav {
    display: grid;
    grid-template-columns: repeat(5, minmax(74px, 1fr));
    overflow-x: auto;
    padding: 0;
  }

  .nav-button {
    position: relative;
    min-width: 82px;
    min-height: 54px;
    grid-template-columns: 1fr;
    grid-template-rows: 20px auto;
    justify-items: center;
    gap: 5px;
    padding: 7px;
    text-align: center;
  }

  .nav-count {
    position: absolute;
    top: 4px;
    right: 8px;
  }

  .admin-workspace {
    padding: 26px 20px 60px;
  }
}

@media (max-width: 620px) {
  .workspace-header h1 {
    font-size: 21px;
  }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .metric-card {
    min-height: 116px;
    grid-template-columns: 32px minmax(0, 1fr);
    column-gap: 10px;
    padding: 16px 12px;
  }

  .metric-icon {
    width: 32px;
    height: 32px;
  }

  .metric-card strong {
    font-size: 19px;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-control {
    min-width: 0;
    max-width: none;
    flex: none;
  }

  .field-select,
  .command-button {
    width: 100%;
  }

  .segmented-control {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .segmented-control button {
    min-width: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .result-count {
    margin-left: 0;
  }

  .edit-form {
    grid-template-columns: 1fr;
  }

  .edit-form .full-field {
    grid-column: 1;
  }

  .beta-toolbar .command-button {
    margin-left: 0;
  }

  .toolbar-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-left: 0;
  }

  .toolbar-actions .command-button {
    width: 100%;
    padding: 0 8px;
  }

  .check-control,
  .pagination {
    justify-content: space-between;
  }

  .pagination {
    width: 100%;
  }

  .modal-actions {
    grid-column: 1;
  }

  .activity-row {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .activity-score {
    grid-column: 2;
    text-align: left;
  }
}

.field-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #ffc107;
}

.field-hint .ns-icon {
  margin-top: 2px;
  font-size: 13px;
}
</style>
