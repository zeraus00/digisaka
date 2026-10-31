import 'dart:io';
import 'dart:math';

import 'dart:ui' as ui;

import 'package:flutter/painting.dart';

import 'package:exif/exif.dart';
import 'package:image/image.dart' as img;
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

/// Data burned into the bottom-left stamp of a captured leaf photo.
class StampData {
  final double? latitude;
  final double? longitude;
  final double? accuracyMeters;
  final DateTime capturedAt;
  final String line;
  final String isoWeek;

  const StampData({
    this.latitude,
    this.longitude,
    this.accuracyMeters,
    required this.capturedAt,
    required this.line,
    required this.isoWeek,
  });
}

/// Burns a GPS / date / label stamp into [input] and saves a new JPEG file.
///
/// The original file is never overwritten. The stamped copy is written to the
/// app's temporary directory as `stamped_<timestamp>.jpg` and its [File] is
/// returned.
///
/// Location is optional: when [latitude]/[longitude] are null the stamp reads
/// "Location unavailable" but still burns the date/time and label.
Future<File> stampImage(File input, {required StampData data}) async {
  final bytes = await input.readAsBytes();

  // Read EXIF orientation so the stamp is never rotated or sideways.
  int orientation = 1;
  try {
    final exif = await readExifFromBytes(bytes);
    final tag = exif['Image Orientation'];
    if (tag != null) {
      orientation = int.tryParse(tag.toString()) ?? 1;
    }
  } catch (_) {
    // Ignore unreadable EXIF and stamp the image as-is.
  }

  // Decode the source image with dart:ui (does not apply EXIF orientation).
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  final source = frame.image;

  final double srcW = source.width.toDouble();
  final double srcH = source.height.toDouble();

  // Upright dimensions after applying EXIF orientation.
  final bool swap = orientation == 5 ||
      orientation == 6 ||
      orientation == 7 ||
      orientation == 8;
  final double uprightW = swap ? srcH : srcW;
  final double uprightH = swap ? srcW : srcH;

  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);

  // Draw the source image upright within the upright frame.
  _drawOriented(canvas, source, srcW, srcH, orientation);
  // Canvas is back in the upright (untransformed) frame here.

  // --- stamp: semi-transparent dark band, bottom-left, white text ---
  final fontSize = uprightW * 0.028;
  final clampedFontSize = fontSize.clamp(14.0, 48.0);
  final lineHeight = clampedFontSize * 1.25;
  final pad = 12.0;
  final bandH = lineHeight * 3 + pad * 2;

  final bandPaint = ui.Paint()
    ..color = const ui.Color(0x00000000).withValues(alpha: 0.55);
  final band = ui.RRect.fromLTRBR(
    pad,
    uprightH - bandH - pad,
    uprightW - pad,
    uprightH - pad,
    const ui.Radius.circular(12),
  );
  canvas.drawRRect(band, bandPaint);

  final textStyle = TextStyle(
    fontSize: clampedFontSize,
    color: const ui.Color(0xFFFFFFFF),
    shadows: [
      ui.Shadow(
        blurRadius: 6,
        color: const ui.Color(0xFF000000),
        offset: ui.Offset.zero,
      ),
    ],
  );

  final coordLine = data.latitude != null && data.longitude != null
      ? '${data.latitude!.toStringAsFixed(6)}, ${data.longitude!.toStringAsFixed(6)}  '
          '±${(data.accuracyMeters ?? 0).round()} m'
      : 'Location unavailable';
  final dateLine = DateFormat('yyyy-MM-dd HH:mm:ss').format(data.capturedAt);
  final labelLine = 'Leaf · ${data.line} · ${data.isoWeek}';

  final tp = TextPainter(textDirection: ui.TextDirection.ltr);
  double y = uprightH - bandH - pad + 10;
  for (final line in <String>[coordLine, dateLine, labelLine]) {
    tp.text = TextSpan(text: line, style: textStyle);
    tp.layout(maxWidth: uprightW - pad * 2 - 24);
    tp.paint(canvas, ui.Offset(pad + 12, y));
    y += lineHeight;
  }

  final picture = recorder.endRecording();
  final stamped = await picture.toImage(uprightW.toInt(), uprightH.toInt());

  // Encode to JPEG via the `image` package.
  final byteData = await stamped.toByteData();
  final stampedImg = img.Image.fromBytes(
    width: stamped.width,
    height: stamped.height,
    bytes: byteData!.buffer,
  );
  final jpgBytes = img.encodeJpg(stampedImg, quality: 85);

  final dir = await getTemporaryDirectory();
  final file = File(
    '${dir.path}/stamped_${DateTime.now().millisecondsSinceEpoch}.jpg',
  );
  await file.writeAsBytes(jpgBytes);
  return file;
}

/// Draws [source] upright according to its EXIF [orientation].
///
/// After this returns the canvas is back in the upright (untransformed) frame,
/// so the caller can draw the stamp in normal bottom-left coordinates.
void _drawOriented(ui.Canvas canvas, ui.Image source, double w, double h,
    int orientation) {
  canvas.save();
  switch (orientation) {
    case 1: // normal
      break;
    case 2: // flip horizontal
      canvas.translate(w, 0);
      canvas.scale(-1, 1);
      break;
    case 3: // rotate 180
      canvas.translate(w, h);
      canvas.rotate(pi);
      break;
    case 4: // flip vertical
      canvas.translate(0, h);
      canvas.scale(1, -1);
      break;
    case 5: // mirror horizontal + rotate 270 CW
      canvas.translate(h, w);
      canvas.rotate(pi / 2);
      canvas.scale(-1, 1);
      break;
    case 6: // rotate 90 CW
      canvas.translate(h, 0);
      canvas.rotate(pi / 2);
      break;
    case 7: // mirror horizontal + rotate 90 CW
      canvas.rotate(-pi / 2);
      canvas.scale(-1, 1);
      break;
    case 8: // rotate 270 CW
      canvas.translate(0, w);
      canvas.rotate(-pi / 2);
      break;
  }
  canvas.drawImage(source, ui.Offset.zero, ui.Paint());
  canvas.restore();
}
