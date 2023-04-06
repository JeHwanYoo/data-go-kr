#!/usr/bin/env node

import {Command} from 'commander/esm.mjs'
import * as fs from "fs/promises"
import {createRequire} from 'module'
import vkbeautify from 'vkbeautify'

const require = createRequire(import.meta.url)
const packageData = require('./package.json')

const program = new Command();

program
    .name(packageData.name)
    .description(packageData.description + "\ndocs: https://www.npmjs.com/package/data-go-kr")
    .version(packageData.version)

program
    .requiredOption('-c, --config <string>', '공공데이터 API 요청 시 필요한 파라미터들의 설정 파일 경로 (required)')
    .option('-m, --service-name <string>', '서비스 명')
    .option('-s, --service-key <string>', '서비스 키')
    .option('-a, --auth-type <string>', '인증 타입 (header|query)')
    .option('-e, --endpoint <string>', '엔드포인트 주소')
    .option('-r, --max-retries <number>', '요청 실패 시 최대 재시도 회수', v => parseInt(v), 5)
    .option('-d, --delay <number>', '요청 실패 시 재시도 전 대기시간 (ms)', v => parseInt(v), 1000)
    .option('-n, --num-of-rows <number>', '페이지 당 불러올 행의 개수', v => parseInt(v), 10)
    .option('-p, --page-no <number>', '페이지 번호', v => parseInt(v), 1)
    .option('--pretty <indent>', '이쁘게 출력', v => parseInt(v))
    .option('--no-num-of-rows', '기본 페이지네이션 파라미터(num-of-rows)를 사용하지 않음')
    .option('--no-page-no', '기본 페이지네이션 파라미터(page-no)를 사용하지 않음')

program.parse(process.argv)

const formatter = new Map([
    ['application/json', vkbeautify.json],
    ['text/xml', vkbeautify.xml],
    ['application/xml', vkbeautify.xml],
])

/**
 *
 * @param {string} config
 * @return {Promise<object>}
 * @throws Error
 */
async function readConfigFile(config) {
    return JSON.parse((await fs.readFile(config)).toString())
}

/**
 *
 * @param {object} params
 * @return {Promise<{contentType: string, data: string}>} encoding json
 * @throws Error
 */
async function fetchData(params) {
    const {serviceKey, authType, endpoint, serviceName, ...rest} = params
    const url = new URL(`${endpoint}`)

    url.pathname = url.pathname.endsWith('/')
        ? url.pathname + serviceName
        : url.pathname + '/' + serviceName

    const fetchOptions = {
        method: 'GET'
    }

    if (authType === 'header') {
        Object.assign(fetchOptions, {
            headers: `Authorization: ${serviceKey}`
        })
    } else if (authType === 'query') {
        url.searchParams.set('serviceKey', String(serviceKey))
    }

    for (const [key, val] of Object.entries(rest)) {
        url.searchParams.set(key, String(val))
    }

    let response;
    try {
        response = await fetch(url)
    } catch (e) {
        throw new Error('Bad Request', {cause: [e]})
    }

    const contentType = response.headers.get('Content-Type').split(';')[0];

    if (!formatter.has(contentType)) {
        throw new Error('Bad Request', {cause: [`Unsupported response format ${contentType}`]})
    }

    const data = await response.text()

    if (data.startsWith('<OpenAPI_ServiceResponse>')) {
        throw new Error('Bad Request', {cause: [data]})
    }

    return {
        contentType,
        data
    }
}

/**
 * @param {any} value
 * @throws Error
 */
function checkNaturalNumber(keyname, value) {
    if (!Number.isInteger(value) || Number(value) <= 0) {
        throw new Error('Bad Arguments', {cause: [`error: ${keyname} should be integer and greater than 0`]})
    }
}

/**
 *
 * @param {string} key
 * @param {string} value
 * @param {string[]} allowed
 */
function checkEnumValue(key, value, allowed) {
    if (!allowed.includes(value)) {
        throw new Error('Bad Arguments', {cause: [`error: ${key} should be in ${JSON.stringify(allowed)}`]})
    }
}

/**
 *
 * @param {object} param
 * @param {string} key
 * @param {any} a
 * @param {any} [b]
 * @throws Error
 */
function mergeParams(param, key, a, b) {
    if (!a && !b) {
        throw new Error('Bad Arguments', {cause: [`error: ${key} must be defined`]})
    }

    Object.assign(param, {
        [convertKebabToCamelCase(key)]: a ? a : b
    })
}

/**
 *
 * @param {string} kebab kebab-case string
 * @returns {string} camelCase string
 */
export function convertKebabToCamelCase(kebab) {
    return kebab.replaceAll(/-([a-z])/g, (_, match) => match.toUpperCase())
}

/**
 *
 * @return {Promise<string>}
 */
async function getData() {
    const {
        config,
        maxRetries,
        delay,
        numOfRows,
        pageNo,
        pretty,
        serviceKey,
        serviceName,
        authType,
        endpoint
    } = program.opts()

    let params = {}
    let data
    let contentType
    let retries = maxRetries
    while (data === undefined) {
        try {
            const configFile = await readConfigFile(config)

            mergeParams(params, 'max-retries', maxRetries, configFile['maxRetries'])
            mergeParams(params, 'delay', delay, configFile['delay'])
            mergeParams(params, 'num-of-rows', numOfRows, configFile['numOfRows'])
            mergeParams(params, 'page-no', pageNo, configFile['pageNo'])
            mergeParams(params, 'pretty', pretty, configFile['pretty'])
            mergeParams(params, 'service-key', serviceKey, configFile['serviceKey'])
            mergeParams(params, 'service-name', serviceName, configFile['serviceName'])
            mergeParams(params, 'auth-type', authType, configFile['authType'])
            mergeParams(params, 'endpoint', endpoint, configFile['endpoint'])

            checkEnumValue('--auth-type', params['authType'], ['header', 'query'])
            checkNaturalNumber('max-retries', maxRetries)
            checkNaturalNumber('delay', delay)
            checkNaturalNumber('num-of-rows', numOfRows)
            checkNaturalNumber('page-no', pageNo)
            pretty && checkNaturalNumber('pretty', pretty)

            const {contentType: _contentType, data: _data} = await fetchData(params)
            data = _data
            contentType = _contentType
        } catch (e) {
            if (e.cause) {
                for (const errorMessage of e.cause) {
                    console.error(errorMessage)
                }
            } else {
                console.error(e)
            }
        }

        if (retries-- === 0) {
            process.exit(1)
        }
        if (data === undefined) {
            await new Promise(resolve => setTimeout(resolve, delay));
            console.error(`\n# Retry ${maxRetries - retries}/${maxRetries}`)
        }
    }

    if (params['pretty']) {
        const format = formatter.get(contentType)
        return format(data, params['pretty'])
    } else {
        return data
    }
}

const data = await getData()
console.log(data)
