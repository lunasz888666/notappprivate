package com.xiaoxiao.custommynotes

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.vungle.ads.*

class VungleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), InterstitialAdListener {

    private var interstitialAd: InterstitialAd? = null
    private val TAG = "VungleModule"

    override fun getName(): String {
        return "VungleModule"
    }

    @ReactMethod
    fun initSdk(appId: String) {
        VungleAds.init(reactApplicationContext, appId, object : InitializationListener {
            override fun onSuccess() {
                Log.d(TAG, "Vungle SDK init onSuccess()")
            }

            override fun onError(vungleError: VungleError) {
                Log.e(TAG, "Vungle SDK init failed: ${vungleError.errorMessage}")
            }
        })
    }

    @ReactMethod
    fun loadInterstitial(placementId: String) {
        interstitialAd = InterstitialAd(reactApplicationContext, placementId, AdConfig()).apply {
            adListener = this@VungleModule
            load()
        }
        Log.d(TAG, "Started loading interstitial ad for placement: $placementId")
    }

    @ReactMethod
    fun playInterstitial() {
        if (interstitialAd?.canPlayAd() == true) {
            interstitialAd?.play()
            Log.d(TAG, "Playing interstitial ad")
        } else {
            Log.w(TAG, "Interstitial ad not ready to play")
        }
    }

    // region InterstitialAdListener
    override fun onAdLoaded(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad loaded, creativeId: ${baseAd.creativeId}")
    }

    override fun onAdStart(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad started")
    }

    override fun onAdImpression(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad impression")
    }

    override fun onAdEnd(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad ended")
    }

    override fun onAdClicked(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad clicked")
    }

    override fun onAdLeftApplication(baseAd: BaseAd) {
        Log.d(TAG, "Interstitial ad left application")
    }

    override fun onAdFailedToLoad(baseAd: BaseAd, adError: VungleError) {
        Log.e(TAG, "Interstitial ad failed to load: ${adError.errorMessage}")
    }

    override fun onAdFailedToPlay(baseAd: BaseAd, adError: VungleError) {
        Log.e(TAG, "Interstitial ad failed to play: ${adError.errorMessage}")
    }
    // endregion
}
