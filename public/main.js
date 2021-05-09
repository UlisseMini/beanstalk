function $(x) {return document.querySelector(x)}
function h(t, attrs, children) {
  const el = document.createElement(t)
  if (attrs) Object.keys(attrs).forEach(attr => {el[attr] = attrs[attr]})
  if (children) children.forEach(child => el.append(child))
  return el
}

// global state, kept in sync with form
let apiKey = ""

const api = {}

api.throwForStatus = async (resp, json) => {
  if (!resp.ok) {
    throw new Error(`bad status: ${resp.status} body: ${json || await resp.json()}`)
  }
}

// api key info (like owner)
api.key = async () => {
  return fetch("/api/key", {headers: {"API-Key": apiKey}})
}

api.uuid = async (username) => {
  return fetch(`/api/uuid?username=${username}`)
}

api.status = async (uuid) => {
  const q = new URLSearchParams({"uuid": uuid})
  return fetch("/api/status?" + q.toString(), {headers: {"API-Key": apiKey}})
}

const set = async () => {
  const resp = await api.key()
  const info = await resp.json()
  $("#key-info").innerText = JSON.stringify(info, null, 2)

  if (!resp.ok) {
    alert(`bad api key, status: ${resp.statusText}`)
  }
}

const renderStatus = (status) => {
  console.log(status)
  const s = status.session

  const text = s.online
    ? (`playing ${s.gameType}, ${s.mode}` + (s.map ? ` on ${s.map}` : ``))
    : `Offline`

  const el = h('p', null, [text])
  $("#stalk").replaceWith(h('div', {id: 'stalk'}, [el]))
}

let i = null

const stalk = async (username) => {
  // 0. clear previous subscription
  if (i != null) clearInterval(i)

  // 1. uuid from username
  const resp = await api.uuid(username)
  await api.throwForStatus(resp)
  const uuid = (await resp.json()).id

  let oldStatus = '{}'
  i = setInterval(async () => {
    const resp = await api.status(uuid)
    await api.throwForStatus(resp)
    const status = await resp.json()
    const statusString = JSON.stringify(status)
    if (statusString != oldStatus) {
      oldStatus = statusString
      renderStatus(status)
    }
  }, 1000)
}

const onload = () => {
  $("form").addEventListener("submit", (e) => {
    e.preventDefault()
    apiKey = e.target.apikey.value
    stalk(e.target.username.value)
  })
}

document.addEventListener("DOMContentLoaded", onload)
