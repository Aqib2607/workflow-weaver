import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Read the built index.html to extract asset filenames
const indexPath = path.join(projectRoot, 'backend', 'public', 'index.html');
const bladePath = path.join(projectRoot, 'backend', 'resources', 'views', 'app.blade.php');

try {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Extract CSS and JS filenames using regex
  const cssMatch = indexContent.match(/assets\/(index-[^"]+\.css)/);
  const jsMatch = indexContent.match(/assets\/(index-[^"]+\.js)/);
  
  if (!cssMatch || !jsMatch) {
    console.error('Could not find asset filenames in index.html');
    process.exit(1);
  }
  
  const cssFilename = cssMatch[1];
  const jsFilename = jsMatch[1];
  
  // Create the Laravel blade template content
  const bladeContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowBuilder</title>
    <script type="module" crossorigin src="{{ asset('assets/${jsFilename}') }}"></script>
    <link rel="stylesheet" crossorigin href="{{ asset('assets/${cssFilename}') }}">
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

  // Write the updated blade template
  fs.writeFileSync(bladePath, bladeContent);
  
  console.log('✅ Successfully updated app.blade.php with new asset filenames:');
  console.log(`   CSS: ${cssFilename}`);
  console.log(`   JS:  ${jsFilename}`);
  
} catch (error) {
  console.error('❌ Error updating assets:', error.message);
  process.exit(1);
}