import Link from "next/link";
import Image from "next/image";

import EventRowCards from "@/app/ui/home/events_row_cards";
import {
  fetchEventsPresentOrFuture,
  fetchPlansPresentOrFuture,
} from "@/app/lib/data";
import PlanRowCards from "@/app/ui/home/plans_row_cards";

import TopBanner from "./ui/home/top_banner";
import NavLinks from "./ui/customer_dashboard/nav-links";

export default async function Page() {
  const eventData = await fetchEventsPresentOrFuture();
  const planData = await fetchPlansPresentOrFuture();

  return (
    <main>
      <TopBanner />
      <div className="flex flex-wrap items-stretch">
        <NavLinks />
      </div>
      <div className="mt-4 flex grow flex-col gap-4">
        <div className="flex items-center justify-center p-6 md:px-28 md:py-12">
          <Image
            alt="Screenshots of the dashboard project showing desktop version"
            className="hidden md:block"
            height={760}
            src="/Full_Temple_Pic.jpg"
            width={1000}
          />
          <Image
            alt="Screenshot of the dashboard project showing mobile version"
            className="block md:hidden"
            height={620}
            src="/Full_Temple_Pic.jpg"
            width={560}
          />
        </div>

        <p className="text-gray-800 text-justify mx-10">
          The Jurong West Combined Temple, also known as the Tian Gong Tan Zhao
          Ling Gong Temple, is currently located at Jurong West St 41. With
          humble beginnings from a wooden temple erected in 1917, the temple has
          moved several times before finding its permanent home in 1992 after
          tireless efforts by villagers and devotees. Dedicated to the worship
          of the Heavenly Duke (Tian Gong) and Goddess of Mercy (Qian Shou Guan
          Yin), it hosts other deities including the Lady of the Nine Heavens
          (Jiu Tian Xuan Nü) and Lords Zhu, Xing, and Li. The temple stands as a
          sacred site and cultural hub, hosting many festivals open to the
          public.
        </p>
        <p className="text-gray-800 text-justify mx-10">
          Visitors to the temple can witness a living tradition spanning more
          than a century, while its serene ambience offers spiritual seekers
          with a peace of mind. Come join our events and celebrations to
          experience the rich heritage, vibrant culture, and spiritual energy of
          this temple!
        </p>
        <p className="text-gray-800 text-justify mx-10">
          裕廊西联合宫, 也称为天公坛昭灵宫,
          现位于裕廊西41街。该寺庙始建于1917年, 最初是一座木制庙宇,
          经历了多次搬迁后, 最终在1992年, 经过村民和信徒们不懈的努力,
          找到了永久的家。寺庙主要供奉天公（玉皇大帝）和千手观音,
          同时也供奉其他神灵, 如九天玄女以及朱、邢、李大人。如今,
          这座寺庙既是一个神圣的场所，也是一个文化中心，举办许多向公众开放的节日庆典。
        </p>
        <p className="text-gray-800 text-justify mx-10">
          前来参观的来宾可以见证这一跨越百年的活生生的传统,
          寺庙宁静的氛围为寻求精神慰藉的人们带来内心的平静。欢迎大家参与我们的活动和庆典,
          亲身体验这座历史悠久的寺庙所蕴含的丰富文化遗产、充满活力的文化以及强大的精神力量!
        </p>

        <div>
          <Link
            className="flex items-center gap-5 self-start rounded-lg bg-yellow-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-yellow-700 md:text-base"
            href="/events"
          >
            <h1> On-going & Upcoming Events</h1>
          </Link>
          <EventRowCards data={eventData} />
        </div>
        <div>
          <Link
            className="flex items-center gap-5 self-start rounded-lg bg-yellow-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-yellow-700 md:text-base"
            href="/plans"
          >
            <h1> Available Plans</h1>
          </Link>
          <PlanRowCards data={planData} />
        </div>
      </div>
    </main>
  );
}
