import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:wiz/constants/app_styles.dart';

class WebViewScreen extends StatefulWidget {
  final String url;
  final String title;

  const WebViewScreen({super.key, required this.url, required this.title});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.url;
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading progress
            if (progress == 100) {
              setState(() => _isLoading = false);
            }
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
              _currentUrl = url;
            });
            print('📄 Page started loading: $url');
          },
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
            print('✅ Page finished loading: $url');
          },
          onWebResourceError: (WebResourceError error) {
            print('❌ WebView error: ${error.description}');
            setState(() => _isLoading = false);
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow navigation to all URLs
            print('🔗 Navigating to: ${request.url}');
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text(widget.title, style: AppStyles.h3(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppStyles.textPrimary(context)),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          // Refresh button
          IconButton(
            icon: Icon(Icons.refresh, color: AppStyles.primary),
            onPressed: () {
              _controller.reload();
              setState(() => _isLoading = true);
            },
            tooltip: 'Refresh',
          ),

          // Open in browser (optional)
          IconButton(
            icon: Icon(Icons.open_in_browser, color: AppStyles.primary),
            onPressed: () async {
              // You can add url_launcher functionality here
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Opening in external browser...'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
            tooltip: 'Open in browser',
          ),
        ],
      ),
      body: Stack(
        children: [
          // WebView
          WebViewWidget(controller: _controller),

          // Loading indicator
          if (_isLoading)
            Container(
              color: AppStyles.background(context),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppStyles.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Loading...', style: AppStyles.body(context)),
                  ],
                ),
              ),
            ),
        ],
      ),

      // Bottom navigation for back/forward
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // Back button
                IconButton(
                  icon: Icon(Icons.arrow_back_ios, size: 20),
                  color: AppStyles.primary,
                  onPressed: () async {
                    if (await _controller.canGoBack()) {
                      _controller.goBack();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('No previous page'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                  tooltip: 'Back',
                ),

                // Forward button
                IconButton(
                  icon: Icon(Icons.arrow_forward_ios, size: 20),
                  color: AppStyles.primary,
                  onPressed: () async {
                    if (await _controller.canGoForward()) {
                      _controller.goForward();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('No next page'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                  tooltip: 'Forward',
                ),

                // Home button (reload original URL)
                IconButton(
                  icon: Icon(Icons.home, size: 20),
                  color: AppStyles.primary,
                  onPressed: () {
                    _controller.loadRequest(Uri.parse(widget.url));
                  },
                  tooltip: 'Home',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
