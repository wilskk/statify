import React from "react";

interface CalculatorProps {
  onButtonClick: (value: string) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onButtonClick }) => {
  // Layout: 5 rows, 6 columns, 0 spans 2 columns, Delete right of ')', no extra row
  const buttons = [
    ["+", "<", ">", "7", "8", "9"],
    ["-", "<=", ">=", "4", "5", "6"],
    ["*", "==", "\u2260", "1", "2", "3"],
    ["/", "&", "|", "0", "."],
    ["^", "~", "(", ")", "Delete", ""], // ^ di bawah /, Delete col-span-2
  ];

  const handleClick = (value: string) => {
    if (value === "Delete") {
      onButtonClick("");
    } else if (value === "~") {
      onButtonClick("not(");
    } else if (value === "^") {
      onButtonClick("**");
    } else if (value === "\u2260" || value === "≠") {
      onButtonClick("!=");
    } else {
      onButtonClick(value);
    }
  };

  return (
    <div className="my-4">
      <div className="grid grid-cols-6 gap-1">
        {buttons.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((button, colIndex) => {
              // Special case: '0' button in 4th row, col 3
              if (button === "0" && rowIndex === 3 && colIndex === 3) {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleClick(button)}
                    className={`
                      px-2 md:px-3 py-2 text-xs md:text-sm
                      bg-white hover:bg-gray-100
                      border border-[#999999]
                      active:border-t-[#666666]
                      active:border-l-[#666666]
                      active:border-b-white
                      active:border-r-white
                      rounded-md
                      col-span-2
                      min-h-[32px] md:min-h-[36px]
                    `}
                    style={{ gridColumn: "span 2 / span 2" }}
                  >
                    {button}
                  </button>
                );
              } else if (
                button === "Delete" &&
                rowIndex === 4 &&
                colIndex === 4
              ) {
                // Delete button col-span-2 di kanan baris terakhir
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleClick(button)}
                    className={`
                      px-2 md:px-3 py-2 text-xs md:text-sm
                      bg-white hover:bg-gray-100
                      border border-[#999999]
                      active:border-t-[#666666]
                      active:border-l-[#666666]
                      active:border-b-white
                      active:border-r-white
                      rounded-md
                      col-span-2
                      min-h-[32px] md:min-h-[36px]
                    `}
                    style={{ gridColumn: "span 2 / span 2" }}
                  >
                    {button}
                  </button>
                );
              } else if (button && !(rowIndex === 4 && colIndex === 5)) {
                // Normal button, skip cell kosong di baris terakhir
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleClick(button)}
                    className={`
                      px-2 md:px-3 py-2 text-xs md:text-sm
                      bg-white hover:bg-gray-100
                      border border-[#999999]
                      active:border-t-[#666666]
                      active:border-l-[#666666]
                      active:border-b-white
                      active:border-r-white
                      rounded-md
                      min-h-[32px] md:min-h-[36px]
                    `}
                  >
                    {button === "\u2260" ? "≠" : button}
                  </button>
                );
              } else {
                // Empty cell for grid alignment
                return <div key={`${rowIndex}-${colIndex}`} />;
              }
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
