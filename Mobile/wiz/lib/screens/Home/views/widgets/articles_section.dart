import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:wiz/constants/app_styles.dart';

class ArticlesSection extends StatefulWidget {
  final List<Map<String, String>> articles;
  const ArticlesSection({super.key, required this.articles});

  @override
  State<ArticlesSection> createState() => _ArticlesSectionState();
}

class _ArticlesSectionState extends State<ArticlesSection> {
  int currentArticleIndex = 0;

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
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: DecorationImage(image: AssetImage(article['image']!), fit: BoxFit.cover),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withOpacity(0.7), Colors.transparent],
                    ),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Align(
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      article['title']!,
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
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
                color: currentArticleIndex == i ? AppStyles.primary : AppStyles.textSecondary(context).withOpacity(0.3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
