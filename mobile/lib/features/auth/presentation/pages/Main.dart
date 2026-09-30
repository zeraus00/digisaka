import 'package:flutter/material.dart';
import 'app_bottom_nav.dart';
import 'HomeScreen.dart'; // must match your Home file's real name
import 'History.dart';
import 'leaf_scan.dart';
import 'profile.dart';

/// The main container of the app. It owns the ONE bottom nav bar.
/// Only the body above the nav bar animates when you switch tabs;
/// the nav bar itself stays perfectly still.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;

  // 1 = the new page slides in from the right, -1 = from the left.
  double _direction = 1;

  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
      value: 1, // start fully visible (no animation on first load)
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _changeTab(int index) {
    if (index == _currentIndex) return;
    setState(() {
      _direction = index > _currentIndex ? 1 : -1;
      _currentIndex = index;
    });
    _controller.forward(from: 0); // play the page transition
  }

  @override
  Widget build(BuildContext context) {
    // On Android, pressing Back on any other tab returns to Home
    // instead of closing the app.
    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _changeTab(0);
      },
      child: Scaffold(
        // Only the body is animated. The nav bar is outside of it.
        body: AnimatedBuilder(
          animation: _animation,
          builder: (context, child) {
            return Opacity(
              opacity: _animation.value.clamp(0.0, 1.0),
              child: FractionalTranslation(
                translation: Offset(_direction * 0.10 * (1 - _animation.value), 0),
                child: child,
              ),
            );
          },
          // IndexedStack keeps Home, History and Profile alive
          // (scroll position, toggles, etc. are remembered).
          child: IndexedStack(
            index: _currentIndex,
            children: [
              HomeScreen(onTabChange: _changeTab),
              HistoryScreen(onGoHome: () => _changeTab(0)),
              // Built only while selected, so the camera is released
              // when you leave the Scan tab.
              _currentIndex == 2 ? const LeafScanScreen() : const SizedBox.shrink(),
              const ProfileScreen(),
            ],
          ),
        ),
        bottomNavigationBar: AppBottomNav(
          currentIndex: _currentIndex,
          onTap: _changeTab,
        ),
      ),
    );
  }
}