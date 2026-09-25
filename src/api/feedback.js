import api from './index'

export function submitBugReport(data) {
  return api.post('/feedback', data)
}
