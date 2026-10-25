/* Codemagic: ресурсные бандлы подов не должны подписываться профилем приложения —
   иначе xcodebuild archive падает сразу. Вставляем правило в post_install сгенерированного Podfile. */
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'ios', 'Podfile');
let pf = fs.readFileSync(file, 'utf8');
if (!pf.includes('CODE_SIGNING_ALLOWED')) {
  const hook = `
    installer.pods_project.targets.each do |t|
      next unless t.respond_to?(:product_type) && t.product_type == "com.apple.product-type.bundle"
      t.build_configurations.each { |c| c.build_settings["CODE_SIGNING_ALLOWED"] = "NO" }
    end
`;
  const patched = pf.replace(/(react_native_post_install\([\s\S]*?\n\s*\))/, '$1' + hook);
  if (patched === pf) { console.error('patch-podfile: не нашёл react_native_post_install в ios/Podfile'); process.exit(1); }
  fs.writeFileSync(file, patched);
}
console.log('patch-podfile: ok');
