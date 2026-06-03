/**
 * Privacy disclosure footer — shown on every screen.
 * This app collects no personal information of any kind.
 */
export default function Footer() {
  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-white text-center">
      <p className="text-xs text-gray-400 leading-snug">
        This app does not collect, store, or transmit any personal information,
        IP addresses, or usage data. All progress is saved only on your device.
      </p>
    </div>
  );
}
