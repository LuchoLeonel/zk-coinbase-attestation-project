export const Footer = () => {
  return (
    <footer className="bg-gray-900 backdrop-blur-sm border-t py-3 sm:py-4">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} zkAccess SDK Demo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}; 