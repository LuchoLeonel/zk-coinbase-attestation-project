export const Header = () => {
  return (
    <div className="sticky lg:static bg-gray-900 top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-2 sm:px-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <div className="flex justify-center items-center h-12 sm:h-16 ml-2 sm:ml-4">
            <div className="text-white font-bold text-lg sm:text-xl px-2 sm:px-0">ZK SDK Demo</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 