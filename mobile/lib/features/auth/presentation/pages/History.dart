import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import 'leaf_scan.dart';
import 'profile.dart';

/// Simple model for one bulk record (replace with your real data later).
class BulkRecord {
  final String name;
  final String date;
  final int leavesScanned;
  final String status;

  const BulkRecord({
    required this.name,
    required this.date,
    required this.leavesScanned,
    required this.status,
  });
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  // History is the selected tab on this page.
  final int _selectedTab = 1;

  // Empty for now -> shows the "no bulk assessments" message.
  // Fill this list with real data later.
  final List<BulkRecord> _records = [];

  // FIX: replace this screen instead of stacking a new one on top.
  void _goToLeafScan() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LeafScanScreen()),
    );
  }

  // FIX: replace this screen instead of stacking a new one on top.
  void _goToProfile() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ProfileScreen()),
    );
  }

  // FIX: always return to the first route (Home), no matter how deep
  // the navigation stack is.
  void _goHome() {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F5F2),
      appBar: _buildAppBar(),
      body: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Recent bulk assessments grouped by plant, bulk ID, date, and Black Sigatoka stage.',
                style: TextStyle(
                  fontSize: 13.5,
                  color: AppColors.textGrey,
                  height: 1.4,
                ),
              ),
              Expanded(
                child: _records.isEmpty ? _buildEmptyState() : _buildList(),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  /// Top bar: "Bulk Recent Scanned" title on the left, close (X) button on the right.
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.white,
      elevation: 0,
      automaticallyImplyLeading: false,
      titleSpacing: 20,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      title: const Text(
        'Bulk Recent Scanned',
        style: TextStyle(
          color: AppColors.primaryGreen,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 16),
          child: CircleAvatar(
            radius: 20,
            backgroundColor: const Color(0xFFF3F5F2),
            child: IconButton(
              icon: const Icon(Icons.close, color: AppColors.primaryGreen, size: 20),
              onPressed: _goHome,
            ),
          ),
        ),
      ],
    );
  }

  /// Centered message shown when there are no bulk assessments yet.
  Widget _buildEmptyState() {
    return const Align(
      alignment: Alignment(0, -0.6),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 10),
        child: Text(
          'No bulk assessments have been completed yet. Run a bulk assessment to see it here.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: AppColors.textGrey,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  /// Simple list used once there are records.
  Widget _buildList() {
    return ListView.separated(
      padding: const EdgeInsets.only(top: 16),
      itemCount: _records.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final r = _records[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      r.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${r.date} · ${r.leavesScanned} leaves',
                      style: const TextStyle(fontSize: 12.5, color: AppColors.textGrey),
                    ),
                  ],
                ),
              ),
              Text(
                r.status,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryGreen,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Same bottom nav as Home, with History highlighted.
  Widget _buildBottomNav() {
    return BottomAppBar(
      color: AppColors.primaryGreen,
      height: 70,
      padding: EdgeInsets.zero,
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(icon: Icons.home_outlined, label: 'Home', index: 0, onTap: _goHome),
          _buildNavItem(icon: Icons.description_outlined, label: 'History', index: 1),
          _buildScanNavItem(),
          _buildNavItem(
            icon: Icons.person_outline,
            label: 'Profile',
            index: 3,
            onTap: _goToProfile,
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required int index,
    VoidCallback? onTap,
  }) {
    final bool isSelected = _selectedTab == index;
    final Color color = isSelected ? AppColors.accentYellow : AppColors.white;

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildScanNavItem() {
    return InkWell(
      onTap: _goToLeafScan,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 46,
            width: 46,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.white, width: 3),
            ),
            child: const Icon(Icons.center_focus_strong, color: AppColors.white, size: 22),
          ),
          const SizedBox(height: 4),
          const Text(
            'Scan',
            style: TextStyle(color: AppColors.white, fontSize: 11),
          ),
        ],
      ),
    );
  }
}