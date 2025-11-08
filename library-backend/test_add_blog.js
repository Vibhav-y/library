import fs from 'fs'

const BASE = 'http://localhost:3000'

async function main(){
  // login
  const loginRes = await fetch(`${BASE}/api/admin/login`, {method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({email: 'admin@local', password: 'admin123'})})
  const loginJson = await loginRes.json()
  console.log('login:', loginJson)
  if(!loginJson.token) return

  const form = new FormData()
  const blog = { title: 'Test blog from script', subTitle: 'sub', description: '<p>hello</p>', category: 'Startup', isPublished: true }
  form.append('blog', JSON.stringify(blog))
  form.append('image', fs.createReadStream('./sample-upload.jpg'))

  const res = await fetch(`${BASE}/api/blog/add`, { method: 'POST', headers: { Authorization: loginJson.token, ...form.getHeaders?.() }, body: form })
  const js = await res.json()
  console.log('/api/blog/add ->', js)
}

main().catch(e=>console.error(e))
