import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:path_provider/path_provider.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Copiar archivos del build de React a un directorio accesible
  final localDir = await getApplicationDocumentsDirectory();
  final webDir = Directory('${localDir.path}/webapp');
  await copyBuildToLocalDir(webDir);

  // Servir los archivos con shelf_static
  final handler = createStaticHandler(
    webDir.path,
    defaultDocument: 'index.html',
    serveFilesOutsidePath: true,
  );

  final server = await shelf_io.serve(
    handler,
    InternetAddress.loopbackIPv4,
    8080,
  );

  runApp(MyApp(serverPort: server.port));
}

/// Copia todos los archivos del build a un directorio local
Future<void> copyBuildToLocalDir(Directory destDir) async {
  final buildFiles = {
    'index.html': 'assets/index.html',
    'assets/index.js': 'assets/index.js',
    'assets/index.css': 'assets/index.css',
  };

  for (final entry in buildFiles.entries) {
    final destPath = File('${destDir.path}/${entry.key}');
    await destPath.parent.create(recursive: true);
    final data = await rootBundle.load(entry.value);
    await destPath.writeAsBytes(
      data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
      flush: true,
    );
  }
}

class MyApp extends StatelessWidget {
  final int serverPort;
  const MyApp({super.key, required this.serverPort});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WebView Local',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.deepPurple),
      home: MyHomePage(serverPort: serverPort),
    );
  }
}

class MyHomePage extends StatefulWidget {
  final int serverPort;
  const MyHomePage({super.key, required this.serverPort});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller =
        WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..loadRequest(Uri.parse('http://localhost:${widget.serverPort}/'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('WebView Local Server')),
      body: WebViewWidget(controller: controller),
    );
  }
}
