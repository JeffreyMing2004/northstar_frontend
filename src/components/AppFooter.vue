<template>
  <footer class="ns-footer">
    <div class="footer-inner">
      <div class="footer-brand">NORTHSTAR © 2026 MC竞技平台</div>
      <div class="footer-links">
        <router-link to="/legal/terms">用户协议</router-link>
        <router-link to="/legal/privacy">隐私政策</router-link>
        <router-link to="/legal/cookies">Cookie 协议</router-link>
        <a href="mailto:northstar2026@yeah.net">联系支持</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.ns-footer {
  background: rgba(10,10,10,0.95);
  border-top: 1px solid rgba(255,165,0,0.2);
  padding: 24px 0;
  margin-top: auto;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-brand {
  color: #666;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
}
.footer-links {
  display: flex;
  gap: 24px;
}
.footer-links a {
  color: #555;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s;
}
.footer-links a:hover {
  color: var(--accent-primary);
}
@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    gap: 14px;
    text-align: center;
  }
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 18px;
  }
}
</style>
