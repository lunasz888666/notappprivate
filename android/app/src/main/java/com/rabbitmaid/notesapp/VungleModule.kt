package com.rabbitmaid.notesapp

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.vungle.ads.VungleAds
import com.vungle.ads.InitializationListener
import com.vungle.ads.VungleError

class VungleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "VungleModule"
    }

    @ReactMethod
    fun initSdk(appId: String) {
        VungleAds.init(reactApplicationContext, appId, object : InitializationListener {
            override fun onSuccess() {
                Log.d("VungleModule", "Vungle SDK init onSuccess()")
            }

            override fun onError(vungleError: VungleError) {
                Log.e("VungleModule", "Vungle SDK init failed: ${vungleError.errorMessage}")
            }
        })
    }

    @ReactMethod
    fun playAd(placementId: String) {
        // 示例，只打 log；实际可根据官方文档调用广告
        Log.d("VungleModule", "playAd called with placementId: $placementId")
        // if (VungleAds.canPlayAd(placementId)) { VungleAds.playAd(...) }
    }
}