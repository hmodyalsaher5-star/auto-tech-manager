function Header() {
  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
      {/* جهة اليمين: اسم النظام */}
      <h1 className="text-xl font-bold text-blue-400">
        🚗 إلكترونيات السيارات
      </h1>

      {/* جهة اليسار: المستخدم */}
      <div className="text-gray-300 text-sm">
        مرحباً، المدير
      </div>
    </header>
  )
}

export default Header