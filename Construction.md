1. Đăng nhập & Xác thực người dùng (có 2FA, phân quyền)
@startuml
actor User
participant "Frontend (ReactJS)" as FE
participant "Backend (Spring Boot)" as BE
participant "Auth Service" as Auth
participant "2FA Service" as TwoFA

User -> FE: Nhập email + password
FE -> BE: Gửi request login(email, password)
BE -> Auth: Kiểm tra thông tin đăng nhập
Auth --> BE: Kết quả (OK/NOK)

alt Thông tin hợp lệ
  BE -> TwoFA: Gửi mã OTP đến User
  TwoFA -> User: Gửi OTP (email/sms/app)
  User -> FE: Nhập OTP
  FE -> BE: Gửi OTP xác thực
  BE -> TwoFA: Kiểm tra OTP
  TwoFA --> BE: Xác thực thành công
  BE -> FE: Trả về JWT + role (admin/user)
else Sai mật khẩu hoặc OTP
  BE -> FE: Trả lỗi đăng nhập
end

FE -> User: Lưu session, chuyển hướng dashboard
@enduml

2. Upload tài liệu
@startuml
actor User
participant FE
participant BE
participant "File Storage (S3/MinIO)" as Storage
participant "AI Service" as AI

User -> FE: Chọn/kéo thả file (PDF, DOCX)
FE -> BE: Request upload(file)
BE -> BE: Kiểm tra định dạng + kích thước
alt Hợp lệ
  BE -> Storage: Lưu file
  Storage --> BE: OK
  BE -> AI: Gửi yêu cầu quét file
  AI --> BE: Trạng thái "Đang xử lý"
  BE -> FE: Thông báo "Upload thành công, đang quét..."
else Không hợp lệ
  BE -> FE: Trả lỗi (sai định dạng/kích thước quá lớn)
end
@enduml

3. Rà quét tài liệu (AI phát hiện thông tin nhạy cảm)
@startuml
actor "AI Engine" as AIEngine
participant BE
participant Storage
participant DB

BE -> AIEngine: Gửi file đã upload
AIEngine -> Storage: Tải file để phân tích
AIEngine -> AIEngine: Phân tích văn bản
alt Phát hiện dữ liệu nhạy cảm
  AIEngine -> BE: Trả về thông tin nhạy cảm (vị trí, loại)
  BE -> DB: Lưu kết quả + log
  BE -> DB: Cập nhật trạng thái file = "Có dữ liệu nhạy cảm"
else Không có dữ liệu nhạy cảm
  AIEngine -> BE: Trả kết quả "An toàn"
  BE -> DB: Cập nhật trạng thái file = "Sẵn sàng xem"
else Lỗi phân tích
  AIEngine -> BE: Trả lỗi
  BE -> DB: Cập nhật trạng thái file = "Lỗi"
end
@enduml

4. Xem tài liệu
@startuml
actor User
participant FE
participant BE
participant DB
participant Storage

User -> FE: Yêu cầu xem danh sách tài liệu
FE -> BE: API getDocuments(userId/role)
BE -> DB: Truy vấn danh sách tài liệu theo quyền
DB --> BE: Danh sách tài liệu
BE --> FE: Trả danh sách

User -> FE: Click mở tài liệu
FE -> BE: API getDocument(fileId)
BE -> DB: Kiểm tra trạng thái file
alt File chưa quét xong
  BE --> FE: Trả thông báo "Đang xử lý"
else File đã quét xong
  BE -> Storage: Lấy file content
  Storage --> BE: File content
  BE -> DB: Lấy thông tin nhạy cảm (nếu có)
  BE --> FE: Trả nội dung + highlight + cảnh báo
end
@enduml

5. Chia sẻ tài liệu (Nâng cao)
@startuml
actor Owner as User
participant FE
participant BE
participant DB

User -> FE: Chọn chia sẻ tài liệu
FE -> BE: API shareDocument(fileId, userIds)
BE -> DB: Cập nhật quyền truy cập
DB --> BE: OK
BE -> DB: Ghi log thay đổi quyền
BE --> FE: Thông báo "Chia sẻ thành công"
@enduml

6. Role Quản trị viên – Xem báo cáo
@startuml
actor Admin
participant FE
participant BE
participant DB
participant "Analytics/BI Engine" as BI

Admin -> FE: Yêu cầu xem báo cáo
FE -> BE: API getReport(params)
BE -> DB: Truy vấn dữ liệu thống kê (file, user, lỗi AI)
BE -> BI: Tạo biểu đồ thống kê (theo loại dữ liệu nhạy cảm, tần suất lỗi, tần suất chia sẻ)
BI --> BE: Kết quả biểu đồ/report
BE --> FE: Render dashboard (biểu đồ, bảng)
@enduml