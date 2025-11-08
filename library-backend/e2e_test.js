import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

const BASE = 'http://localhost:3000'

const random = () => Math.random().toString(36).slice(2, 8)

async function run() {
  try {
    const username = `user_${random()}`
    const email = `e2e_${random()}@example.com`
    const password = 'Password123!'

    console.log('Registering user', email)
    const reg = await axios.post(`${BASE}/api/user/register`, { username, email, password })
    if (!reg.data || !reg.data.success) throw new Error('Register failed: ' + JSON.stringify(reg.data))
    console.log('Registered. Token received (truncated):', reg.data.token?.slice(0, 20))

    console.log('Logging in')
    const login = await axios.post(`${BASE}/api/user/login`, { email, password })
    if (!login.data || !login.data.success) throw new Error('Login failed: ' + JSON.stringify(login.data))
    const token = login.data.token
    console.log('Login OK. Token (truncated):', token.slice(0, 20))

    // Prepare blog form
    const form = new FormData()
    const blog = { title: 'E2E Test Blog ' + random(), subTitle: 'E2E sub', description: '<p>Test content</p>', category: 'Startup', isPublished: true }
    form.append('blog', JSON.stringify(blog))
    const imgPath = path.join(process.cwd(), 'sample-upload.jpg')
    if (!fs.existsSync(imgPath)) throw new Error('sample-upload.jpg not found in server folder')
    form.append('image', fs.createReadStream(imgPath))

    console.log('Posting blog with image')
    const postRes = await axios.post(`${BASE}/api/blog/add`, form, { headers: { ...form.getHeaders(), Authorization: token }, maxContentLength: Infinity, maxBodyLength: Infinity })
    console.log('/api/blog/add response:', postRes.data)
    if (!postRes.data.success) throw new Error('Add blog failed: ' + JSON.stringify(postRes.data))

    console.log('Fetching public blog list')
    const all = await axios.get(`${BASE}/api/blog/all`)
    console.log('/api/blog/all response: (showing latest 5)')
    const blogs = all.data.blogs || []
    console.log(blogs.slice(0,5))

    console.log('E2E test completed successfully')
  } catch (err) {
    console.error('E2E test failed:', err.message)
    if (err.response) {
      console.error('Response data:', err.response.data)
    }
    process.exitCode = 1
  }
}

run()
