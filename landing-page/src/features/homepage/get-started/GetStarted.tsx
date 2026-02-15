import { Card } from "@/components/Card";
import editorMockupSrc from "./assets/editor-mockup.png";
import publishClickSrc from "./assets/publish-click.png";
import signUpButtonSrc from "./assets/signup-button.png";

const _imagesBasePath = "/images/sections/get-started";

const instructions = [
  {
    image: {
      src: signUpButtonSrc,
      alt: "A button in the center with label 'Sign up'",
    },
    title: "Step 1",
    description:
      "Create your secure account and link your financial sources—like QuickBooks, Stripe, or Google Sheets—in just a few clicks.",
  },
  {
    image: {
      src: editorMockupSrc,
      alt: "A mockup of a chatbot editor interface",
    },
    title: "Step 2",
    description: "Your AI advisor immediately analyzes your cash flow and expenses, spotting trends and hidden risks you might have missed.",
  },
  {
    image: {
      src: publishClickSrc,
      alt: "A mouse over a 'Publish' button",
    },
    title: "Step 3",
    description:
      "Chat with your data. Ask 'Can I afford to hire?' or 'Where can I cut costs?' and get data-backed answers instantly.",
  },
];

export const GetStarted = () => {
  return (
    <div className="flex flex-col gap-8">
      <h2>Get Started with ProfitPilot</h2>
      <div className="flex flex-col md:flex-row max-w-7xl gap-2">
        {instructions.map((instruction) => (
          <InstructionCard
            key={instruction.title}
            image={instruction.image}
            title={instruction.title}
            description={instruction.description}
          />
        ))}
      </div>
    </div>
  );
};

const InstructionCard = ({
  image,
  title,
  description,
}: (typeof instructions)[number]) => {
  return (
    <Card className="flex flex-col items-center gap-6 p-1.5 pb-6">
      <img src={image.src} alt={image.alt} className="rounded-xl" />
      <div className="flex flex-col gap-2 px-3">
        <h3 className="uppercase font-bold text-lg">{title}</h3>
        <p>{description}</p>
      </div>
    </Card>
  );
};
