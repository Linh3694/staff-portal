# Sử dụng Node.js làm base image
FROM node:16

# Cài đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt các dependency
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Build ứng dụng React
RUN npm run build

# Sử dụng Nginx làm web server để phục vụ ứng dụng
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]