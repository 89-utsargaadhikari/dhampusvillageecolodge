export default function TreeBorder() {
  return (
    <div className="relative h-20 w-full overflow-hidden bg-[#f8f7f4] sm:h-28" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,120 L140,78 L260,112 L380,52 L500,98 L640,36 L780,104 L900,62 L1040,108 L1180,46 L1310,92 L1440,58 L1440,160 L0,160 Z"
          fill="#0d0b08"
        />
        <path
          d="M0,120 L140,78 L260,112 L380,52 L500,98 L640,36 L780,104 L900,62 L1040,108 L1180,46 L1310,92 L1440,58"
          fill="none"
          stroke="#E4B84A"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  )
}
