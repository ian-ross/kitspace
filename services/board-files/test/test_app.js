const assert = require('assert')
const supertest = require('supertest')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const path = require('path')

const config = require('../config')
const app = require('../src/app')
const GitlabClient = require('../../../modules/gitlab-client')

const gitlab = new GitlabClient('https://gitlab2.kitnic.it/accounts')

describe('app', () => {
    let id, sha
    before(async () => {
        const projects = await gitlab.getProjects()
        id = projects[0].id
        sha = await gitlab.getProjectHead(id)
    })
    it('404s on invalid requests', async () => {
        await supertest(app)
            .get(`/board-files/xxx`)
            .expect(404)
    })
    it('404s on invalid names', async () => {
        await supertest(app)
            .get(`/board-files/${id}/${sha}/images/invalid`)
            .expect(404)
    })
    it('serves top.svg', async () => {
        const r = await supertest(app)
            .get(`/board-files/${id}/${sha}/images/top.svg`)
            .expect(200)
        assert(r.header['content-type'] === 'image/svg+xml; charset=utf-8')
        assert(r.body)
        await sleep(100)
        await readFile(
            path.join(config.cache_dir, String(id), sha, 'images', 'top.svg')
        )
    })
    it('serves bottom.svg', async () => {
        const r = await supertest(app)
            .get(`/board-files/${id}/${sha}/images/bottom.svg`)
            .expect(200)
        assert(r.header['content-type'] === 'image/svg+xml; charset=utf-8')
        assert(r.body)
    })
})

function trace(x) {
    console.log(x)
    return x
}

function sleep(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value))
}