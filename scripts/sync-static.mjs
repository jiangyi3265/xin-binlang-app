import { cpSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(projectRoot, 'static')
const platform = process.argv[2] || 'mp-weixin'
if (!['mp-weixin', 'h5'].includes(platform)) throw new Error('不支持的构建平台')
const outputRoot = resolve(projectRoot, 'dist', 'build', platform)
const targetDir = resolve(outputRoot, 'static')

if (!existsSync(sourceDir)) {
  throw new Error(`静态资源目录不存在：${sourceDir}`)
}

if (!existsSync(outputRoot)) {
  throw new Error(`构建目录不存在：${outputRoot}`)
}

cpSync(sourceDir, targetDir, { recursive: true, force: true })

const requiredTabbarIcons = [
  'home.png',
  'home-on.png',
  'record.png',
  'record-on.png',
  'rules.png',
  'rules-on.png'
]

for (const icon of requiredTabbarIcons) {
  const iconPath = resolve(targetDir, 'tabbar', icon)
  if (!existsSync(iconPath)) {
    throw new Error(`tabBar 图标未复制：${iconPath}`)
  }
}

console.log(`已同步 ${platform} 静态资源：${readdirSync(sourceDir).length} 个一级目录/文件`)
