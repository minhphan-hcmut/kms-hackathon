# Sử dụng image Node.js gọn nhẹ dựa trên Alpine Linux để tối ưu hóa kích thước image
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json trước để tận dụng Docker cache cho layer cài đặt dependencies
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build Nest.js)
RUN npm install

# Sao chép toàn bộ mã nguồn vào thư mục làm việc
COPY . .

# Build dự án TypeScript thành JavaScript trong thư mục /dist
RUN npm run build

# Cấu hình biến môi trường mặc định (có thể bị ghi đè bởi docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Expose cổng 3000 ra ngoài container
EXPOSE 3000

# Lệnh chạy ứng dụng Nest.js phiên bản đã build
CMD ["npm", "run", "start:prod"]
