<template>
  <div class="docs container">
    <h1 class="section-title">文档中心</h1>
    <p class="docs-desc">平台使用指南、API文档、开发者文档、常见问题与更新日志</p>
    <div v-if="!selectedDoc" class="docs-layout">
      <aside class="docs-sidebar">
        <nav class="sidebar-nav">
          <div v-for="cat in categories" :key="cat.key"
            :class="['sidebar-item', { active: activeCat === cat.key }]"
            @click="activeCat = cat.key">
            <span class="sidebar-icon"><NsIcon :name="cat.icon" /></span>
            <span>{{ cat.label }}</span>
            <span class="sidebar-count">{{ getCatCount(cat.key) }}</span>
          </div>
        </nav>
      </aside>
      <main class="docs-main">
        <div class="docs-search">
          <NsIcon name="search" />
          <input v-model="searchQuery" placeholder="搜索文档..." class="search-input" />
        </div>
        <div v-if="currentDocs.length === 0" class="docs-empty">
          <NsIcon name="file" />
          <p>未找到匹配的文档</p>
        </div>
        <div v-for="(doc, idx) in currentDocs" :key="idx" class="doc-card ns-card" @click="openDoc(doc)">
          <div class="doc-header">
            <h3 class="doc-title">{{ doc.title }}</h3>
            <span class="ns-tag">{{ doc.tag }}</span>
          </div>
          <p class="doc-excerpt">{{ doc.excerpt }}</p>
          <div class="doc-footer">
            <span class="doc-date">更新于 {{ doc.date }}</span>
            <a href="#" class="doc-link" @click.prevent="openDoc(doc)">阅读全文 &rarr;</a>
          </div>
        </div>
      </main>
    </div>
    <div v-else class="doc-detail">
      <button class="back-btn ns-btn" @click="selectedDoc = null">
        <NsIcon name="arrow-left" /> 返回文档列表
      </button>
      <article class="doc-article ns-card">
        <div class="article-header">
          <span class="article-cat ns-tag">{{ selectedDoc.tag }}</span>
          <h1 class="article-title">{{ selectedDoc.title }}</h1>
          <div class="article-meta">
            <span><NsIcon name="clock" /> 更新于 {{ selectedDoc.date }}</span>
            <span><NsIcon name="user" /> NorthStar 团队</span>
          </div>
        </div>
        <div class="article-body" v-html="selectedDoc.content"></div>
        <div class="article-nav">
          <button v-if="getPrevDoc()" class="ns-btn nav-btn" @click="openDoc(getPrevDoc())">
            <NsIcon name="arrow-left" /> {{ getPrevDoc().title }}
          </button>
          <div class="nav-spacer"></div>
          <button v-if="getNextDoc()" class="ns-btn nav-btn" @click="openDoc(getNextDoc())">
            {{ getNextDoc().title }} <NsIcon name="arrow-right" />
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import docsData from '../data/docs.json'
const activeCat = ref('guide')
const selectedDoc = ref(null)
const searchQuery = ref('')
const categories = [
  { key: 'guide', icon: 'file', label: '使用指南' },
  { key: 'api', icon: 'wrench', label: 'API文档' },  { key: 'faq', icon: 'question', label: '常见问题' },
  { key: 'changelog', icon: 'tag', label: '更新日志' }
]
const docs = docsData
function openDoc(doc) { selectedDoc.value = doc; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function getCatCount(key) { return (docs[key] || []).length }
function getPrevDoc() { if (!selectedDoc.value) return null; const l = docs[activeCat.value] || []; const i = l.indexOf(selectedDoc.value); return i > 0 ? l[i - 1] : null }
function getNextDoc() { if (!selectedDoc.value) return null; const l = docs[activeCat.value] || []; const i = l.indexOf(selectedDoc.value); return i < l.length - 1 ? l[i + 1] : null }
const currentDocs = computed(() => { const list = docs[activeCat.value] || []; if (!searchQuery.value.trim()) return list; const q = searchQuery.value.toLowerCase(); return list.filter(d => d.title.toLowerCase().includes(q) || d.excerpt.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q)) })
</script>
<style scoped>
.docs { padding: 40px 30px 80px; }
.docs-desc { color: var(--text-secondary); font-size: 16px; margin-top: -20px; margin-bottom: 40px; }
.docs-layout { display: flex; gap: 32px; }
.docs-sidebar { width: 220px; flex-shrink: 0; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; position: sticky; top: 90px; }
.sidebar-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; font-weight: 600; font-size: 14px; color: var(--text-secondary); border: 1px solid transparent; transition: all 0.3s; }
.sidebar-item:hover { color: var(--text-primary); background: rgba(255,140,0,0.05); border-color: var(--border-color); }
.sidebar-item.active { color: var(--accent-primary); background: rgba(255,140,0,0.08); border-color: var(--accent-primary); }
.sidebar-icon { font-size: 18px; }
.sidebar-count { margin-left: auto; font-size: 12px; color: var(--text-muted); background: rgba(255,140,0,0.1); padding: 2px 8px; border-radius: 10px; }
.docs-main { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.docs-search { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; }
.docs-search .ns-icon { color: var(--text-muted); font-size: 16px; }
.search-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; }
.search-input::placeholder { color: var(--text-muted); }
.docs-empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.docs-empty .ns-icon { font-size: 48px; margin-bottom: 16px; display: block; }
.doc-card { padding: 24px; cursor: pointer; transition: all 0.3s; }
.doc-card:hover { border-color: var(--accent-primary); transform: translateY(-2px); }
.doc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.doc-title { font-size: 18px; font-weight: 700; }
.doc-excerpt { color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
.doc-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border-color); }
.doc-date { font-size: 13px; color: var(--text-muted); }
.doc-link { font-size: 14px; font-weight: 600; color: var(--accent-primary); }
.doc-link:hover { text-shadow: 0 0 10px var(--accent-glow); }
.back-btn { margin-bottom: 24px; }
.back-btn .ns-icon { margin-right: 6px; }
.doc-detail { max-width: 900px; }
.article-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color); }
.article-cat { margin-bottom: 12px; }
.article-title { font-size: 32px; font-weight: 800; margin: 12px 0; }
.article-meta { display: flex; gap: 24px; color: var(--text-muted); font-size: 14px; margin-top: 12px; }
.article-meta span { display: flex; align-items: center; gap: 6px; }
.article-meta .ns-icon { font-size: 14px; }
.article-body { line-height: 1.8; color: var(--text-secondary); }
.article-body :deep(h2) { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 32px 0 16px; }
.article-body :deep(h3) { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 24px 0 12px; }
.article-body :deep(h4) { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 20px 0 10px; }
.article-body :deep(p) { margin-bottom: 16px; }
.article-body :deep(ul), .article-body :deep(ol) { margin-bottom: 16px; padding-left: 24px; }
.article-body :deep(li) { margin-bottom: 8px; }
.article-body :deep(code) { background: rgba(255,140,0,0.1); padding: 2px 6px; font-family: monospace; font-size: 13px; color: var(--accent-primary); }
.article-body :deep(pre) { background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); padding: 16px; margin-bottom: 16px; overflow-x: auto; }
.article-body :deep(pre code) { background: none; padding: 0; color: var(--text-secondary); }
.article-body :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
.article-body :deep(th), .article-body :deep(td) { padding: 10px 14px; border: 1px solid var(--border-color); text-align: left; }
.article-body :deep(th) { background: rgba(255,140,0,0.08); color: var(--text-primary); font-weight: 700; }
.article-body :deep(strong) { color: var(--text-primary); }
.article-body :deep(a) { color: var(--accent-primary); text-decoration: none; }
.article-body :deep(a:hover) { text-decoration: underline; }
.article-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-color); gap: 16px; }
.nav-btn { font-size: 13px; max-width: 45%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-spacer { flex: 1; }
@media (max-width: 768px) {
  .docs-layout { flex-direction: column; }
  .docs-sidebar { width: 100%; }
  .sidebar-nav { flex-direction: row; overflow-x: auto; position: static; }
  .sidebar-item { white-space: nowrap; }
  .article-title { font-size: 24px; }
  .article-nav { flex-direction: column; }
  .nav-btn { max-width: 100%; width: 100%; }
}
</style>