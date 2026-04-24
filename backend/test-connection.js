/**
 * Diagnostic Test Script — Sprint 6.1: Connectivity Diagnostic Tools
 * Script này kiểm tra kết nối từ máy Host (máy tính của bạn) đến Docker Container của Backend.
 * Nó ping 2 endpoints: /api/health (để kiểm tra service chạy) và /api/docs-json (Swagger UI).
 * 
 * Cách chạy: node test-connection.js
 */

const HEALTH_URL = 'http://localhost:3000/api/health';
const SWAGGER_URL = 'http://localhost:3000/api/docs-json';

// Utility in màu sắc ra console cho dễ đọc
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

async function testEndpoint(name, url) {
  console.log(`\n${colors.cyan}▶ Đang ping [${name}] tại: ${url}${colors.reset}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`${colors.green}${colors.bold}✔ THÀNH CÔNG:${colors.reset}${colors.green} Nhận được HTTP ${response.status} từ ${name}!${colors.reset}`);
      
      const data = await response.json();
      console.log(`${colors.green}  Dữ liệu trả về: ${JSON.stringify(data).slice(0, 100)}...${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✖ LỖI HTTP:${colors.reset} Server trả về mã lỗi ${response.status} - ${response.statusText}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`${colors.red}✖ TIMEOUT:${colors.reset} Không nhận được phản hồi từ server sau 5 giây.`);
    } else if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.log(`${colors.red}✖ KẾT NỐI BỊ TỪ CHỐI (ECONNREFUSED):${colors.reset} Không thể kết nối tới port 3000.`);
    } else {
      console.log(`${colors.red}✖ LỖI MẠNG KHÔNG XÁC ĐỊNH:${colors.reset} ${error.message}`);
    }
    return false;
  }
}

async function runDiagnostics() {
  console.log(`\n${colors.bold}=== BẮT ĐẦU KIỂM TRA KẾT NỐI DOCKER BACKEND ===${colors.reset}`);
  
  const healthOk = await testEndpoint('Health Check', HEALTH_URL);
  const swaggerOk = await testEndpoint('Swagger API', SWAGGER_URL);

  console.log(`\n${colors.bold}=== BÁO CÁO KẾT QUẢ KIỂM TRA ===${colors.reset}`);

  if (healthOk && swaggerOk) {
    console.log(`${colors.green}${colors.bold}🎉 MỌI THỨ HOẠT ĐỘNG HOÀN HẢO!${colors.reset}`);
    console.log(`${colors.green}Backend Nest.js trong Docker đã map port 3000 thành công ra ngoài máy Host.${colors.reset}`);
    console.log(`${colors.green}Bạn có thể mở http://localhost:3000/api/docs trên trình duyệt ngay bây giờ.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️ PHÁT HIỆN LỖI KẾT NỐI! Hãy làm theo các bước khắc phục sau:${colors.reset}`);
    console.log(`${colors.yellow}1. Kiểm tra Docker Compose:${colors.reset} Chạy lệnh \`docker-compose ps\` xem container 'brainlift_backend' có đang trạng thái 'Up' không.`);
    console.log(`${colors.yellow}2. Xem Logs Container:${colors.reset} Chạy \`docker-compose logs -f backend\` để xem Nest.js có bị crash do thiếu .env hay kết nối DB lỗi không.`);
    console.log(`${colors.yellow}3. Cổng 3000 bị trùng:${colors.reset} Đảm bảo không có app nào (ví dụ React Vite cũ) đang chiếm cổng 3000 trên máy thật.`);
    console.log(`${colors.yellow}4. Chờ Container Khởi Động:${colors.reset} Nếu bạn vừa chạy docker-compose up, Nest.js cần vài giây để compile TypeScript. Thử chạy lại script này sau 10 giây!\n`);
  }
}

runDiagnostics();
