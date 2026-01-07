plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.wiz"
    compileSdk = 36  
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    defaultConfig {
        applicationId = "com.example.wiz"
        minSdk = 24
        targetSdk = 36  
        versionCode = 1
        versionName = "1.0"
        multiDexEnabled = true
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    // AppCompat (REQUIRED for Stripe)
    implementation("androidx.appcompat:appcompat:1.7.0")
    
    // Material Components (REQUIRED for Stripe)
    implementation("com.google.android.material:material:1.12.0")
    
    // Fragment KTX (REQUIRED for FlutterFragmentActivity)
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    
    // Core KTX
    implementation("androidx.core:core-ktx:1.13.1")
    
    // Multidex support
    implementation("androidx.multidex:multidex:2.0.1")
}