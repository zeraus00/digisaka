import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/components/app_button.dart';

class LeafScanScreen extends StatefulWidget {
  const LeafScanScreen({super.key});

  @override
  State<LeafScanScreen> createState() => _LeafScanScreenState();
}

class _LeafScanScreenState extends State<LeafScanScreen> {
  final ImagePicker _picker = ImagePicker();

  final List<File> _selectedLeaves = [];

  void _showMessage(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  // Opens the camera. Whatever photo is taken gets added to the grid.
  Future<void> _captureFromCamera() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85, // keeps file size reasonable without losing much detail
    );
    if (photo == null) return; // user cancelled

    setState(() => _selectedLeaves.add(File(photo.path)));
  }

  // Opens the gallery so the user can pick one or more existing photos.
  Future<void> _pickFromGallery() async {
    final List<XFile> photos = await _picker.pickMultiImage(imageQuality: 85);
    if (photos.isEmpty) return; // user cancelled

    setState(() => _selectedLeaves.addAll(photos.map((x) => File(x.path))));
  }

  void _removeLeaf(int index) {
    setState(() => _selectedLeaves.removeAt(index));
  }

  void _clearAll() {
    setState(() => _selectedLeaves.clear());
  }

  // Placeholder for now — wire this to your assessment/API logic later.
  void _handleAssessAllLeaves() {
    if (_selectedLeaves.isEmpty) {
      _showMessage('No leaves added yet');
      return;
    }
    _showMessage('Assessing ${_selectedLeaves.length} leaves...');
    // TODO: Navigate to the Bulk Assess step or call your model here.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F5F2),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTitle(),
              const SizedBox(height: 20),
              _buildStepper(),
              const SizedBox(height: 24),
              _buildScanFrame(),
              const SizedBox(height: 10),
              _buildHintRow(),
              const SizedBox(height: 20),
              _buildCaptureRow(),
              const SizedBox(height: 24),
              _buildSelectedLeavesHeader(),
              const SizedBox(height: 12),
              _buildLeavesGrid(),
              const SizedBox(height: 28),
              _buildAssessButton(),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTitle() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Leaf Scan',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
        SizedBox(height: 6),
        Text(
          'Scan or select banana leaves to check for signs of Black Sigatoka',
          style: TextStyle(fontSize: 13.5, color: AppColors.textGrey, height: 1.4),
        ),
      ],
    );
  }

  /// The 1 - 2 - 3 step indicator at the top.
  Widget _buildStepper() {
    return Row(
      children: [
        _buildStepCircle(number: '1', label: 'Select Leaves', isActive: true),
        _buildStepConnector(),
        _buildStepCircle(number: '2', label: 'Bulk Assess', isActive: false),
        _buildStepConnector(),
        _buildStepCircle(number: '3', label: 'Results', isActive: false),
      ],
    );
  }

  Widget _buildStepCircle({
    required String number,
    required String label,
    required bool isActive,
  }) {
    return Column(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: isActive ? AppColors.primaryGreen : AppColors.borderGrey,
          child: Text(
            number,
            style: TextStyle(
              color: isActive ? AppColors.white : AppColors.textGrey,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            color: isActive ? AppColors.primaryGreen : AppColors.textGrey,
          ),
        ),
      ],
    );
  }

  Widget _buildStepConnector() {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        height: 2,
        color: AppColors.borderGrey,
      ),
    );
  }

  /// Dark green frame with corner brackets and a faint leaf outline guide.
  Widget _buildScanFrame() {
    return AspectRatio(
      aspectRatio: 1.5,
      child: Stack(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [AppColors.darkGreen, Color(0xFF0D3D1E)],
              ),
            ),
            child: Center(
              child: Icon(
                Icons.eco_outlined,
                size: 90,
                color: AppColors.white.withOpacity(0.15),
              ),
            ),
          ),
          // Four corner brackets.
          const _CornerBracket(alignment: Alignment.topLeft),
          const _CornerBracket(alignment: Alignment.topRight),
          const _CornerBracket(alignment: Alignment.bottomLeft),
          const _CornerBracket(alignment: Alignment.bottomRight),
          const Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(bottom: 18),
              child: Text(
                'Position the banana leaf inside the frame',
                style: TextStyle(
                  color: AppColors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHintRow() {
    return const Center(
      child: Text(
        'Good lighting • Clear leaf • Symptoms visible',
        style: TextStyle(fontSize: 12, color: AppColors.textGrey),
      ),
    );
  }

  /// Gallery button on the left, big green camera-capture circle on the right.
  Widget _buildCaptureRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: _pickFromGallery,
          child: Column(
            children: [
              Container(
                height: 56,
                width: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E9D8),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.image_outlined, color: AppColors.accentYellow, size: 26),
              ),
              const SizedBox(height: 6),
              const Text(
                'Gallery',
                style: TextStyle(fontSize: 12, color: AppColors.textDark),
              ),
            ],
          ),
        ),
        const SizedBox(width: 40),
        GestureDetector(
          onTap: _captureFromCamera,
          child: Container(
            height: 64,
            width: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primaryGreen, width: 3),
            ),
            padding: const EdgeInsets.all(6),
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primaryGreen,
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// "N leaves selected" on the left, "Clear all" on the right.
  Widget _buildSelectedLeavesHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '${_selectedLeaves.length} leaves selected',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
        if (_selectedLeaves.isNotEmpty)
          GestureDetector(
            onTap: _clearAll,
            child: const Text(
              'Clear all',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textGrey,
              ),
            ),
          ),
      ],
    );
  }

  /// Grid of leaf thumbnails, each with a red remove (x) button,
  /// plus one dashed "+" tile at the end to add more.
  Widget _buildLeavesGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _selectedLeaves.length + 1, // +1 for the add tile
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, index) {
        if (index == _selectedLeaves.length) {
          return _buildAddTile();
        }
        return _buildLeafThumbnail(index);
      },
    );
  }

  Widget _buildLeafThumbnail(int index) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.file(
            _selectedLeaves[index],
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          bottom: 6,
          left: 0,
          right: 0,
          child: Text(
            'Leaf ${index + 1}',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Positioned(
          top: -6,
          right: -6,
          child: GestureDetector(
            onTap: () => _removeLeaf(index),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 12, color: AppColors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAddTile() {
    return GestureDetector(
      onTap: _pickFromGallery,
      child: DottedBorderBox(
        child: const Icon(Icons.add, color: AppColors.textGrey, size: 26),
      ),
    );
  }

  /// Stays clickable even with 0 leaves, as requested.
  Widget _buildAssessButton() {
    final String label = _selectedLeaves.isEmpty
        ? 'Assess All Leaves'
        : 'Assess All Leaves (${_selectedLeaves.length})';

    // Lighter green when empty (matches the design), but still tappable —
    // tapping it while empty just shows the "No leaves added yet" message.
    final Color buttonColor = _selectedLeaves.isEmpty
        ? AppColors.primaryGreen.withOpacity(0.5)
        : AppColors.primaryGreen;

    return AppButton(
      label: label,
      onPressed: _handleAssessAllLeaves,
      backgroundColor: buttonColor,
      textColor: AppColors.white,
    );
  }
}

/// Small green corner-bracket mark used on each of the 4 corners of the scan frame.
class _CornerBracket extends StatelessWidget {
  final Alignment alignment;

  const _CornerBracket({required this.alignment});

  @override
  Widget build(BuildContext context) {
    final bool isTop = alignment == Alignment.topLeft || alignment == Alignment.topRight;
    final bool isLeft = alignment == Alignment.topLeft || alignment == Alignment.bottomLeft;

    return Align(
      alignment: alignment,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: CustomPaint(
          size: const Size(28, 28),
          painter: _BracketPainter(isTop: isTop, isLeft: isLeft),
        ),
      ),
    );
  }
}

class _BracketPainter extends CustomPainter {
  final bool isTop;
  final bool isLeft;

  _BracketPainter({required this.isTop, required this.isLeft});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.accentYellow
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final double x = isLeft ? 0 : size.width;
    final double y = isTop ? 0 : size.height;
    final double dx = isLeft ? size.width : -size.width;
    final double dy = isTop ? size.height : -size.height;

    path.moveTo(x + dx, y);
    path.lineTo(x, y);
    path.lineTo(x, y + dy);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A dashed-border square used for the "add more" tile.
class DottedBorderBox extends StatelessWidget {
  final Widget child;

  const DottedBorderBox({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(),
      child: Center(child: child),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.textGrey
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(14),
    );

    const double dashWidth = 5;
    const double dashSpace = 4;
    final Path dashPath = Path();

    // Trace the rounded-rectangle outline and chop it into short dashes.
    final Path outline = Path()..addRRect(rrect);
    for (final metric in outline.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        dashPath.addPath(
          metric.extractPath(distance, distance + dashWidth),
          Offset.zero,
        );
        distance += dashWidth + dashSpace;
      }
    }

    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}