export * from './http/index'
export * from './utils/index'
export * from './constants/index'
export * from './interfaces/index'
export * from './libs/index'

import { WEB_TRACKING_DEFAULT_CONFIGS } from './constants/index'
import {
    StorageKeyEnum,
    WebInitOptionsType,
    CycleTypeEnum,
} from './interfaces/index'
import { eventManager } from './libs/eventManager'
import {
    getClientId,
    getSessionId,
    refreshSessionIdCacheTime,
} from './libs/index'
import logger from './libs/logger'
import {
    onAfterSendData,
    onBeforeSendData,
    onPageHide,
    onPageShow,
    onPageView,
} from './libs/observer'
import { getPerformanceInfo, initPerformance } from './libs/performance'
import { initState } from './libs/state'
import {
    deepCloneObj,
    getLocalStorage,
    getUUid,
    getWebTracking,
    isSupportWebTracking,
    setLocalStorage,
} from './utils/index'

export function initWebTracking(options: WebInitOptionsType) {
    // 单例设计模式，已经初始化不再执行
    if (isSupportWebTracking()) {
        return
    }
    const opts = Object.assign(
        deepCloneObj(WEB_TRACKING_DEFAULT_CONFIGS),
        options
    )
    const { beforeInit, afterInit } = opts.on

    beforeInit && beforeInit()

    window._webTracking_ = {
        clientId: getClientId(),
        sessionId: getSessionId(),
        options: opts,
    }
    const sessionIdCacheTime = opts.sessionIdCacheTime
    if (
        sessionIdCacheTime !== null &&
        sessionIdCacheTime !== undefined &&
        typeof sessionIdCacheTime === 'number'
    ) {
        refreshSessionIdCacheTime(sessionIdCacheTime)
    }

    initCycle(options)
    initState()
    initPerformance()

    afterInit && afterInit()

    eventManager.emitter(CycleTypeEnum.PAGE_VIEW)
    logger.log(window._webTracking_)
}

/** 初始化生命周期函数 */
function initCycle(options: WebInitOptionsType) {
    const { pageHide, pageView, sendAfter, sendBefore, pageShow } = options.on
    onPageView(pageView)
    onPageShow(pageShow)
    onPageHide(pageHide)
    onBeforeSendData(sendBefore)
    onAfterSendData(sendAfter)

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            eventManager.emitter(CycleTypeEnum.PAGE_HIDE)
        }

        if (document.visibilityState === 'visible') {
            eventManager.emitter(CycleTypeEnum.PAGE_SHOW)
        }
    })

    window.addEventListener('load', () => {
        getWebTracking().performanceInfo = getPerformanceInfo()
    })
}
