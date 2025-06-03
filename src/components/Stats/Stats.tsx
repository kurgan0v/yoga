import { FC } from "react";
import { AnimatedCircles } from "@/ui";
import "./Stats.css";

interface StatsProps {
  strength: number;
  practiceMinutes: number;
  daysInFlow: number;
  onSelectPractice?: () => void;
  className?: string;
}

const Stats: FC<StatsProps> = ({
  strength,
  practiceMinutes,
  daysInFlow,
  onSelectPractice,
  className = "",
}) => {
  return (
      <section
          className={`stats-container ${className}`}
          aria-label="Статистика практики"
      >
        <div className="meditation-image-container" aria-hidden="true">
          <div className="animated-circles-wrapper">
            <AnimatedCircles streakLevel={daysInFlow} size={260}/>
          </div>

          <img
              src="/assets/images/main-avatar.png"
              alt="Медитирующий человек"
              className="meditation-image"
              loading="eager"
          />
        </div>

        {/* Кнопка выбрать практику прямо под картинкой */}


        {/* Статистика внизу в виде карточек */}
        <div className={'grid grid-cols-2 w-full !mt-6'}>
          <div className={'col-span-2 border-b border-t border-black !p-4 flex flex-col gap-3'}>
            <div className={'flex items-center gap-4 justify-between'}>
              <p className={'text-[#191919]/40 text-sm'}>дней в потоке</p>
              <p className={'font-bold text-2xl'}>{daysInFlow}</p>
            </div>
            <div className={'flex flex-col gap-1'}>
              <div className={'bg-[#E7E7E7] h-4 w-full'}>
                <div className={'w-[70%] h-4 bg-[linear-gradient(90deg,_#E8E8E8_0%,_#F08F67_132.63%)]'}></div>
              </div>
              <div className={'text-[#191919]/40 text-sm flex items-center justify-between'}>
                <p>0</p>
                <p>3</p>
              </div>
            </div>
          </div>
          <div className={'flex flex-col gap-1 items-center !p-4 border-b border-r border-black'}>
            <p className={'font-bold text-2xl'}>{practiceMinutes}</p>
            <p className={'text-[#191919]/40 text-sm'}>минут практики</p>
          </div>
          <div className={'flex flex-col gap-1 items-center !p-4 border-b border-black'}>
            <p className={'font-bold text-2xl'}>{strength}</p>
            <p className={'text-[#191919]/40 text-sm'}>уровень силы</p>
          </div>
        </div>


        <button
            className="practice-button"
            onClick={onSelectPractice}
            aria-label="Выбрать практику"
        >
          <span>выбрать практику</span>
        </button>
      </section>
  );
};

export default Stats;
