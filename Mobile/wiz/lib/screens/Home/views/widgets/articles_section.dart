import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/WebView/webview_screen.dart';

class ArticlesSection extends StatefulWidget {
  final List<Map<String, String>> articles;

  const ArticlesSection({super.key, required this.articles});

  @override
  State<ArticlesSection> createState() => _ArticlesSectionState();
}

class _ArticlesSectionState extends State<ArticlesSection> {
  int currentArticleIndex = 0;

  // Map article titles to URLs
  final Map<String, String> _articleUrls = {
    'Terms and\nConditions': 'https://www.wizrental.online/terms',
    'Cancellation\nrules': 'https://www.wizrental.online/cancellation-policy',
  };

  void _openArticle(String title) {
    final url = _articleUrls[title];

    if (url != null) {
      // Navigate to WebView screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => WebViewScreen(
            url: url,
            title: title.replaceAll('\n', ' '), // Remove line breaks for title
          ),
        ),
      );
    } else {
      // Show error if URL not found
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Article not available'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final articles = widget.articles;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Articles of Wiz', style: AppStyles.h3(context)),
        const SizedBox(height: 16),

        SizedBox(
          height: 180,
          child: PageView.builder(
            itemCount: widget.articles.length,
            onPageChanged: (i) => setState(() => currentArticleIndex = i),
            itemBuilder: (context, index) {
              final article = articles[index];

              return GestureDetector(
                onTap: () => _openArticle(article['title']!),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    image: DecorationImage(
                      image: AssetImage(article['image']!),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black.withOpacity(0.7),
                          Colors.transparent,
                        ],
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Stack(
                      children: [
                        // Title
                        Align(
                          alignment: Alignment.bottomLeft,
                          child: Text(
                            article['title']!,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),

                        // Tap indicator (optional)
                        Positioned(
                          right: 8,
                          bottom: 8,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Read',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_forward,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 8),

        // Page indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            articles.length,
            (i) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: currentArticleIndex == i
                    ? AppStyles.primary
                    : AppStyles.textSecondary(context).withOpacity(0.3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
