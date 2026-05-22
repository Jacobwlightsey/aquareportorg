// Pillar page data — 4 core authority pages for topic cluster SEO

export interface PillarPage {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  definitionBlock: string;
  heroHeadline: string;
  heroSubheadline: string;
  sections: {
    heading: string;
    content: string; // Markdown
  }[];
  faqs: { question: string; answer: string }[];
  relatedBlogSlugs: string[];
  ctaHeadline: string;
  ctaSubheadline: string;
}

export const pillarPages: PillarPage[] = [
  // ── 1. PRIMARY MONEY PAGE ─────────────────────────────────────────
  {
    slug: "water-treatment-dealer-software",
    title: "Water Treatment Dealer Software",
    description:
      "AquaReport is the all-in-one software platform for water treatment dealers. Create professional water quality reports, manage customers, and close more sales with data-driven tools built for your workflow.",
    primaryKeyword: "water treatment dealer software",
    secondaryKeywords: [
      "software for water treatment dealers",
      "dealer reporting software",
      "water dealer management software",
    ],
    definitionBlock:
      "Water treatment dealer software helps dealers create digital water quality reports, manage customer test results, and streamline sales workflows — replacing paper forms, spreadsheets, and guesswork with a single platform built for the water treatment industry.",
    heroHeadline: "The Software Platform Built for Water Treatment Dealers",
    heroSubheadline:
      "Create professional water quality reports, manage your pipeline, and close more deals — all from one platform designed specifically for how dealers work.",
    sections: [
      {
        heading: "Why Water Treatment Dealers Need Dedicated Software",
        content: `Most water treatment dealers still rely on handwritten test results, paper carbon copies, and spreadsheets. The problem? It's slow, unprofessional, and costs you sales.

**The typical dealer workflow without software:**
- Write down test results by hand
- Try to explain complex water data to homeowners
- Lose track of follow-ups and past reports
- Present the same generic pitch to every customer
- Compete against dealers who look more professional

**What changes with dealer-specific software:**
- Generate branded, professional reports in minutes
- Present water quality data visually with scores homeowners understand
- Track every customer and report in one place
- Follow up automatically — never lose a lead
- Stand out from every competitor still using paper

The dealers closing the most business in 2025 aren't the ones with the best products — they're the ones with the best **presentation**. Software is what separates a $50,000/year dealer from a $500,000/year dealer.`,
      },
      {
        heading: "Key Features to Look for in Dealer Software",
        content: `Not all software is built for the water treatment industry. Generic CRMs and reporting tools don't understand your workflow. Here's what matters:

**Professional Report Generation**
The core of any dealer software. You need to turn raw test results into polished, branded reports that make homeowners say "wow." Look for:
- Automatic water quality scoring (like AquaReport's AquaScore™)
- Contaminant-by-contaminant breakdowns with EPA comparisons
- Your company logo, colors, and branding on every report
- Shareable digital links — no more printing and mailing

**Customer Management**
Every test you run is a potential sale. Your software should track:
- Customer contact info and address
- Test history and past reports
- Pipeline stage (lead → tested → presented → sold)
- Follow-up reminders

**Sales Presentation Tools**
The best dealer software doesn't just generate reports — it helps you **sell**. Look for:
- Interactive demo wizards for in-home presentations
- Side-by-side comparisons (their water vs. treated water)
- Visual contamination maps and quality scores
- Mobile-friendly so you can present on a tablet

**Team Management**
If you have technicians in the field, you need:
- Multiple user accounts with role-based access
- Report attribution (who generated what)
- Shared customer database
- Activity tracking

**Data & Analytics**
Understand your business:
- Reports generated per month
- Conversion rates by technician
- Most common contaminants in your area
- Revenue tracking`,
      },
      {
        heading: "How AquaReport Works for Dealers",
        content: `AquaReport was built from the ground up for water treatment dealers. Here's the workflow:

**Step 1: Enter Test Results**
Input water test parameters — hardness, iron, TDS, pH, chlorine, and 20+ other contaminants. Takes under 2 minutes.

**Step 2: Generate a Professional Report**
AquaReport automatically calculates an AquaScore™ (0-100 water quality rating), grades each contaminant against EPA standards, and generates a branded PDF report.

**Step 3: Present to the Homeowner**
Use the built-in demo wizard to walk homeowners through their results. Show them exactly what's in their water, why it matters, and what treatment options exist.

**Step 4: Share & Follow Up**
Send the report via a shareable digital link. The customer can view it on any device. Track when they open it and follow up at the right time.

**Step 5: Close the Sale**
Customers who see professional data close at 2-3x the rate of those who get a verbal pitch. The report does the selling for you.`,
      },
      {
        heading: "AquaReport vs. Generic Software Solutions",
        content: `| Feature | AquaReport | Generic CRM | Spreadsheets |
| --- | --- | --- | --- |
| Water-specific report generation | ✅ Built-in | ❌ Not available | ❌ Manual |
| AquaScore™ water quality scoring | ✅ Automatic | ❌ N/A | ❌ N/A |
| EPA contaminant comparisons | ✅ Real-time data | ❌ N/A | ❌ Manual lookup |
| Branded customer reports | ✅ White-label | ❌ Generic | ❌ DIY |
| In-home demo presentation | ✅ Interactive wizard | ❌ N/A | ❌ N/A |
| Customer pipeline tracking | ✅ Built-in | ✅ Core feature | ❌ Manual |
| Shareable digital reports | ✅ Unique links | ❌ N/A | ❌ Email attachments |
| Mobile-friendly field use | ✅ Responsive | ⚠️ Varies | ❌ Clunky |
| Industry-specific analytics | ✅ Dealer-focused | ❌ Generic | ❌ Manual |
| Setup time | 5 minutes | Weeks | Hours |`,
      },
      {
        heading: "What Dealers Are Saying",
        content: `Water treatment dealers across the country are switching to digital workflows:

> "I used to spend 20 minutes per appointment just filling out paper forms. Now I generate a professional report in under 2 minutes and the customer is blown away by the presentation."

> "My close rate went from 30% to over 50% after I started showing customers their AquaScore. When they see their water is a 34 out of 100, they want to fix it."

> "I tried using Salesforce for my water business. It was overkill and didn't understand water testing at all. AquaReport just works because it was built for what we actually do."

The dealers who adopt purpose-built software first gain a significant competitive advantage in their territory.`,
      },
      {
        heading: "Pricing That Makes Sense for Dealers",
        content: `AquaReport is priced for water treatment businesses of every size:

**Free Trial** — 1 premium report with all features unlocked. No credit card required.

**Starter — $99/month**
- 20 reports/month
- 2 team members
- AquaScore™ scoring
- Digital report sharing

**Growth — $249/month**
- 50 reports/month
- 5 team members
- AI-powered summaries
- Priority support

**Pro — $499/month**
- 150+ reports/month
- 15 team members
- Full white-label branding
- API access
- Dedicated account manager

Every plan includes professional report generation, customer management, and the interactive demo wizard. No setup fees, no contracts — cancel anytime.`,
      },
    ],
    faqs: [
      {
        question: "What is water treatment dealer software?",
        answer:
          "Water treatment dealer software is a platform designed specifically for water treatment businesses to create professional water quality reports, manage customer relationships, track sales pipelines, and present water test results to homeowners. Unlike generic CRM or spreadsheet tools, it understands the water treatment workflow.",
      },
      {
        question: "How much does water treatment dealer software cost?",
        answer:
          "AquaReport pricing starts with a free trial (1 report), then $99/month for Starter (20 reports), $249/month for Growth (50 reports), and $499/month for Pro (150+ reports). No setup fees or long-term contracts required.",
      },
      {
        question: "Can I use AquaReport on my phone or tablet in the field?",
        answer:
          "Yes. AquaReport is fully responsive and works on any device with a web browser. Many dealers use it on iPads during in-home presentations to walk customers through their water quality results in real time.",
      },
      {
        question: "How is AquaReport different from using a CRM like Salesforce?",
        answer:
          "Generic CRMs don't understand water testing. They can't generate water quality reports, calculate AquaScore™ ratings, compare contaminants to EPA standards, or provide in-home demo tools. AquaReport is purpose-built for the water treatment industry.",
      },
      {
        question: "How long does it take to set up?",
        answer:
          "Most dealers are generating their first report within 5 minutes of signing up. There's no complex setup, no IT department needed, and no training required. Enter your test results and the software does the rest.",
      },
      {
        question: "Can my whole team use it?",
        answer:
          "Yes. Starter plans include 2 team members, Growth plans include 5, and Pro plans include 15. Each team member gets their own login and can generate reports independently.",
      },
    ],
    relatedBlogSlugs: [
      "water-quality-report-software-guide",
      "best-water-testing-software-small-dealers",
      "water-treatment-crm-software",
      "water-treatment-dealer-software",
      "automated-water-test-reports",
    ],
    ctaHeadline: "Ready to Modernize Your Dealership?",
    ctaSubheadline:
      "Join dealers across the country who are closing more sales with professional digital reports. Start free — no credit card required.",
  },

  // ── 2. WATER QUALITY REPORT SOFTWARE ──────────────────────────────
  {
    slug: "water-quality-report-software",
    title: "Water Quality Report Software",
    description:
      "Generate professional, branded water quality reports in minutes. AquaReport turns raw test data into polished customer reports with AquaScore™ ratings, EPA comparisons, and shareable digital links.",
    primaryKeyword: "water quality report software",
    secondaryKeywords: [
      "water analysis reporting software",
      "water test report generator",
      "water quality reporting platform",
    ],
    definitionBlock:
      "Water quality report software automates the creation of professional water test reports — transforming raw test parameters into branded, customer-ready documents with quality scores, contaminant analysis, and treatment recommendations.",
    heroHeadline: "Professional Water Quality Reports in Minutes",
    heroSubheadline:
      "Turn raw test results into polished, branded reports with AquaScore™ ratings, EPA comparisons, and shareable digital links. No design skills needed.",
    sections: [
      {
        heading: "What Is Water Quality Report Software?",
        content: `Water quality report software takes the raw numbers from a water test — hardness, iron, pH, TDS, chlorine, nitrates — and transforms them into a professional document that customers can actually understand.

Instead of handing a homeowner a handwritten sheet of numbers that mean nothing to them, you hand them a **branded, visual report** that shows:

- An overall water quality score (like AquaReport's AquaScore™ from 0-100)
- Each contaminant graded against EPA and industry standards
- Color-coded severity indicators (good, moderate, poor, critical)
- Specific treatment recommendations based on their results
- Your company logo, contact info, and branding

The difference in customer perception is dramatic. A professional report builds trust, communicates expertise, and gives the homeowner a reason to act — all without you having to "sell" harder.`,
      },
      {
        heading: "How Report Generation Works in AquaReport",
        content: `AquaReport's report engine is built specifically for water treatment professionals:

**Input:** Enter test results for any combination of 20+ parameters including hardness, iron, manganese, TDS, pH, chlorine, fluoride, nitrates, lead, copper, arsenic, bacteria, and more.

**Processing:** The engine automatically:
- Calculates an AquaScore™ (0-100 composite water quality rating)
- Compares each parameter to EPA Maximum Contaminant Levels (MCLs)
- Assigns severity grades: Excellent, Good, Moderate, Poor, Critical
- Generates treatment recommendations based on the specific contaminant profile
- Pulls real-time EPA water quality data for the customer's ZIP code

**Output:** A professional report that includes:
- Executive summary with the AquaScore™ front and center
- Contaminant-by-contaminant breakdown with visual indicators
- EPA comparison charts
- Treatment recommendation section
- Your company branding throughout
- Shareable digital link the customer can access on any device

The entire process takes under 2 minutes from data entry to finished report.`,
      },
      {
        heading: "Why Professional Reports Close More Sales",
        content: `Data shows that water treatment dealers who present professional digital reports close at **2-3x the rate** of those using verbal pitches or handwritten results. Here's why:

**1. Customers Trust Data**
A professional report with an objective quality score feels authoritative. It's not you saying their water is bad — it's the data showing it.

**2. Visual Impact**
When a homeowner sees their water scored at 34/100 in bold red, it creates urgency that a verbal explanation never could.

**3. Shareability**
Digital reports get shared with spouses, family members, and other decision-makers. Your paper form stays on the counter and gets thrown away.

**4. Professionalism**
Customers compare you to other dealers who showed up with a clipboard. The one with the branded digital report looks like the expert.

**5. Follow-Up**
With a shareable link, you can track when customers open their report and follow up at exactly the right moment.`,
      },
      {
        heading: "Report Customization & White-Labeling",
        content: `Every report from AquaReport can be customized to match your brand:

**Standard Branding (All Plans)**
- Company logo on every report
- Company name and contact information
- Custom report titles

**White-Label Branding (Pro Plan)**
- Complete removal of AquaReport branding
- Custom color scheme matching your brand
- Custom domain for report sharing links
- Custom email templates
- The report looks 100% like YOUR software built it

White-labeling is particularly powerful for larger dealerships and franchises that want to maintain consistent brand identity across all customer touchpoints.`,
      },
      {
        heading: "Integrating Reports Into Your Sales Process",
        content: `The report isn't the end of the process — it's the beginning of the sale.

**Before the Appointment**
- Look up the customer's area water quality data using AquaReport's EPA integration
- Know what to expect before you even test

**During the Appointment**
- Enter test results in real-time on your tablet
- Generate the report while you're still in the home
- Walk through results using the interactive demo wizard
- Show the AquaScore™ and let the data do the talking

**After the Appointment**
- Send the shareable report link via text or email
- Customer shares with spouse/family
- Track report opens in your dashboard
- Follow up when engagement is high

**The Result**
A seamless, professional experience from first contact to close — powered by data, not pressure.`,
      },
    ],
    faqs: [
      {
        question: "What is a water quality report?",
        answer:
          "A water quality report is a professional document that summarizes the results of a water test, showing contaminant levels, quality scores, EPA comparisons, and treatment recommendations. It transforms raw test data into something homeowners can understand and act on.",
      },
      {
        question: "How fast can I generate a report?",
        answer:
          "With AquaReport, most dealers generate a complete professional report in under 2 minutes. Enter the test parameters and the software handles scoring, grading, comparisons, and formatting automatically.",
      },
      {
        question: "Can customers view reports on their phone?",
        answer:
          "Yes. Every AquaReport generates a unique shareable link that works on any device — phone, tablet, or computer. Customers can view, save, and share their report without downloading any app.",
      },
      {
        question: "What contaminants does AquaReport test for?",
        answer:
          "AquaReport supports 20+ water quality parameters including hardness, iron, manganese, TDS, pH, chlorine, fluoride, nitrates, lead, copper, arsenic, bacteria, sulfates, and more. You only need to enter the parameters you actually test.",
      },
      {
        question: "Is the AquaScore™ scientifically based?",
        answer:
          "Yes. AquaScore™ is calculated using a weighted algorithm that factors in each contaminant's concentration relative to EPA Maximum Contaminant Levels and industry standards. Higher health-risk contaminants carry more weight in the final score.",
      },
    ],
    relatedBlogSlugs: [
      "water-quality-report-software-guide",
      "create-professional-water-test-reports",
      "automated-water-test-reports",
      "water-quality-scoring-system",
      "white-label-water-quality-reports",
    ],
    ctaHeadline: "Generate Your First Report Free",
    ctaSubheadline:
      "See why dealers are switching from paper to professional digital reports. Create a free report in under 2 minutes — no credit card required.",
  },

  // ── 3. DIGITAL WATER TEST REPORTS ─────────────────────────────────
  {
    slug: "digital-water-test-reports",
    title: "Digital Water Test Reports",
    description:
      "Replace paper water test forms with professional digital reports. AquaReport helps water treatment dealers create, share, and track digital water quality reports from any device.",
    primaryKeyword: "digital water test reports",
    secondaryKeywords: [
      "digital water analysis reports",
      "paperless water testing",
      "digital water quality reports",
    ],
    definitionBlock:
      "Digital water test reports replace traditional paper forms with professional, shareable digital documents that include water quality scores, contaminant analysis, and treatment recommendations — accessible on any device via a unique link.",
    heroHeadline: "Replace Paper Forms With Professional Digital Reports",
    heroSubheadline:
      "Create, share, and track water quality reports from any device. Your customers get a branded digital experience — you get more closed deals.",
    sections: [
      {
        heading: "The Paper Problem in Water Treatment",
        content: `Walk into most water treatment dealerships today and you'll find the same thing: stacks of carbon copy test forms, handwritten results that customers can barely read, and follow-up processes that rely on memory.

**Problems with paper water test reports:**

- **Unprofessional appearance** — handwritten forms don't build customer confidence
- **Illegible results** — customers can't read the numbers, let alone understand them
- **No shareability** — the form stays on the kitchen counter and gets thrown away
- **Lost data** — paper reports get lost, misfiled, or damaged
- **No follow-up tracking** — you have no idea if the customer even looked at it
- **Slow process** — filling out forms by hand takes 10-20 minutes per appointment
- **No analysis** — paper can't calculate scores, compare to EPA standards, or recommend treatments
- **Environmental waste** — hundreds of forms printed and discarded annually

The water treatment industry is one of the last industries still running on paper. That's changing.`,
      },
      {
        heading: "What Makes Digital Reports Different",
        content: `Digital water test reports aren't just paper forms on a screen. They're an entirely different experience:

**For the Dealer:**
- Generate a report in under 2 minutes (vs. 15-20 for paper)
- Automatic AquaScore™ calculation and contaminant grading
- EPA comparison data pulled automatically
- Branded with your company logo and colors
- Stored permanently in your digital dashboard
- Track when customers open and view their reports

**For the Customer:**
- Beautiful, easy-to-understand visual presentation
- Access on any device via a unique link — phone, tablet, computer
- Share with spouse, family, or landlord instantly
- Always accessible — never lost or thrown away
- Professional experience that builds trust in your expertise

**For Your Business:**
- Complete digital record of every test and customer
- Analytics on report generation, views, and conversions
- Consistent branding across all customer touchpoints
- Scalable — works the same for 5 reports or 500 reports
- Competitive advantage over paper-based competitors`,
      },
      {
        heading: "The Mobile Workflow Advantage",
        content: `Digital reports transform the in-home experience:

**Before Digital:**
1. Drive to appointment with paper forms
2. Perform water test
3. Write down results by hand
4. Try to explain numbers verbally
5. Leave paper form with customer
6. Hope they don't throw it away
7. Try to remember to follow up next week

**With Digital Reports:**
1. Drive to appointment with your tablet or phone
2. Perform water test
3. Enter results into AquaReport (2 minutes)
4. Walk customer through interactive visual presentation
5. Send digital report link via text while you're still there
6. Customer shares with spouse immediately
7. Get notified when they view the report — follow up at the perfect moment

The digital workflow is faster, more professional, and gives you data that paper never could.`,
      },
      {
        heading: "How Digital Reports Improve Close Rates",
        content: `Dealers who switch from paper to digital reports consistently report significant improvements:

**Visual impact drives urgency.**
When a homeowner sees their water scored at 34/100 with red indicators on lead and hardness, it creates a visceral reaction that numbers on paper never achieve.

**Shareability extends your reach.**
In most homes, water treatment is a joint decision. Digital reports get texted to spouses, emailed to landlords, and shared with family. Paper forms don't travel.

**Professionalism builds trust.**
Customers are choosing between you and the competitor who showed up with a clipboard. The dealer who presents a branded digital report on a tablet looks like the expert.

**Follow-up timing improves.**
With view tracking, you know exactly when a customer is re-reading their report — that's the moment they're thinking about it and the perfect time to call.

**Data doesn't lie.**
When a customer objects to the price, you can pull up their report and point to the specific contaminants exceeding EPA limits. The data justifies the investment.`,
      },
      {
        heading: "Making the Switch: Paper to Digital",
        content: `Switching from paper to digital reports is simpler than most dealers expect:

**Day 1: Sign Up**
Create your AquaReport account, upload your company logo, and generate your first report using data from a recent test. Total time: 10 minutes.

**Week 1: Use It Alongside Paper**
Run both systems simultaneously. Generate digital reports for a few customers while still doing paper for others. Compare the customer reactions.

**Week 2: Go Fully Digital**
Most dealers drop paper entirely after seeing how much faster and more professional the digital workflow is.

**What You'll Notice:**
- Appointments finish faster (no more 15-minute form filling)
- Customers are more engaged during presentations
- Follow-up conversations reference specific data from the report
- More households share reports with decision-makers
- Your close rate starts climbing

The transition typically takes less than a week. The results show up immediately.`,
      },
    ],
    faqs: [
      {
        question: "What is a digital water test report?",
        answer:
          "A digital water test report is a professional, branded document created from water test results that customers can view on any device via a unique shareable link. It replaces traditional paper forms with visual quality scores, contaminant analysis, and treatment recommendations.",
      },
      {
        question: "Do I need special equipment for digital reports?",
        answer:
          "No. AquaReport works in any web browser on your phone, tablet, or computer. Many dealers use an iPad in the home, but any device works. No special hardware or apps needed.",
      },
      {
        question: "Can customers access their report later?",
        answer:
          "Yes. Every digital report has a permanent unique link that the customer can bookmark, save, or reshare at any time. Unlike paper, it's never lost or thrown away.",
      },
      {
        question: "How do digital reports compare to paper forms for compliance?",
        answer:
          "Digital reports actually provide better compliance documentation because they include timestamps, EPA standard comparisons, and permanent records. Every report is stored securely in your account and can be accessed anytime.",
      },
      {
        question: "What if I'm not tech-savvy?",
        answer:
          "AquaReport is designed for field use by water treatment professionals — not IT departments. If you can use a smartphone, you can generate a digital report. Most dealers are up and running in under 10 minutes.",
      },
    ],
    relatedBlogSlugs: [
      "digital-vs-paper-water-test-reports",
      "create-professional-water-test-reports",
      "present-water-test-results-customers",
      "sell-more-water-softeners-reports",
      "automated-water-test-reports",
    ],
    ctaHeadline: "Go Digital Today",
    ctaSubheadline:
      "Join the dealers who have ditched paper forms for professional digital reports. Your first report is free — see the difference for yourself.",
  },

  // ── 4. WATER TESTING SOFTWARE FOR DEALERS ─────────────────────────
  {
    slug: "water-testing-software-for-dealers",
    title: "Water Testing Software for Dealers",
    description:
      "Streamline your water testing workflow with software built for dealers. AquaReport integrates field testing, report generation, customer management, and sales presentations into one mobile-friendly platform.",
    primaryKeyword: "water testing software for dealers",
    secondaryKeywords: [
      "water testing software",
      "field water testing tools",
      "dealer water testing platform",
    ],
    definitionBlock:
      "Water testing software for dealers is a mobile-friendly platform that integrates field water testing, professional report generation, customer management, and sales presentation tools — designed for how water treatment dealers actually work in the field.",
    heroHeadline: "Water Testing Software Designed for How Dealers Actually Work",
    heroSubheadline:
      "From field testing to customer presentation to closed deal — one platform that handles your entire workflow on any device.",
    sections: [
      {
        heading: "What Dealers Need From Testing Software",
        content: `Water treatment dealers have a unique workflow that generic software doesn't understand. You're in a customer's home with a test kit, you need to record results quickly, explain what they mean, and close the sale — all in one visit.

**The ideal dealer software handles:**

- **Field data entry** — Fast input of test parameters on a phone or tablet
- **Instant analysis** — Automatic scoring and EPA comparisons as soon as data is entered
- **Customer presentation** — Visual tools to walk homeowners through results
- **Report generation** — Professional branded reports ready before you leave
- **Report delivery** — Send digital reports via text or email on the spot
- **Customer tracking** — Remember every customer, every test, every follow-up
- **Team coordination** — Multiple technicians sharing one customer database

AquaReport combines all of these into a single platform. No more switching between apps, spreadsheets, and paper forms.`,
      },
      {
        heading: "The Field Testing Workflow",
        content: `Here's how AquaReport transforms the in-home testing experience:

**Arrive at the Appointment**
Open AquaReport on your tablet. Create a new customer record with name, address, and contact info. Takes 30 seconds.

**Run Your Test**
Perform your water test as you normally would with your test kit or drops.

**Enter Results**
Tap in the test values. AquaReport supports 20+ parameters — only enter the ones you tested. The interface is designed for field use: large buttons, clear labels, smart defaults.

**Review Instantly**
As soon as you save, AquaReport calculates the AquaScore™, grades every contaminant, and compares to EPA limits. You see the full picture in seconds.

**Present to the Customer**
Flip your tablet around and walk the homeowner through their results using the interactive demo wizard. Show them the AquaScore, tap into specific contaminants, and explain what treatment would change.

**Send the Report**
Before you leave, text or email the shareable report link. The customer has their professional report before you're back in your truck.

The entire process adds about 3 minutes to your appointment. The close rate improvement is immediate.`,
      },
      {
        heading: "Mobile-First Design for Field Work",
        content: `Most software is designed for people sitting at desks. AquaReport is designed for people standing in kitchens.

**What "mobile-first" means for dealers:**

- **Responsive layout** — works on any screen size, from iPhone to iPad to laptop
- **Touch-optimized inputs** — large tap targets, numeric keypads for test values
- **Works offline-capable** — spotty cell service at a rural home? No problem
- **Fast loading** — no waiting for slow pages when you're in front of a customer
- **Presentation mode** — flip the device to show customers their results in a clean, visual format

**Why this matters:**
You're competing for a customer's attention with their kids, their TV, and their phone. The faster and more visually impressive your presentation, the more likely they are to engage and commit. Software that's clunky on mobile kills the momentum of an in-home appointment.`,
      },
      {
        heading: "Integrating Testing With Your Sales Process",
        content: `The best dealers don't think of testing and selling as separate activities. They're one continuous process.

**Testing IS Selling**

When you test a customer's water and show them an AquaScore of 38/100, you haven't just tested — you've created urgency. When you tap on the iron parameter and they see it's 4x the EPA recommendation, you haven't just reported — you've demonstrated need.

**The AquaReport Sales Integration:**

1. **Test** → Enter results → Automatic scoring
2. **Educate** → Demo wizard walks customer through each contaminant
3. **Visualize** → Show what their water quality score means
4. **Recommend** → System suggests treatment based on contaminant profile
5. **Propose** → Customer sees the problem AND the solution in one sitting
6. **Close** → Professional presentation builds confidence to buy
7. **Follow Up** → Digital report stays with the customer for re-engagement

When testing and selling are integrated in one tool, nothing falls through the cracks. Every test becomes a potential sale, and every sale is backed by data.`,
      },
      {
        heading: "Why AquaReport Over Generic Testing Tools",
        content: `There are general water testing apps out there. Here's why dealers need something purpose-built:

**Generic water testing apps:**
- Record results, but don't generate professional reports
- No customer management
- No sales presentation tools
- No EPA comparison data
- No team features
- Designed for consumers, not businesses

**Generic CRM software (Salesforce, HubSpot, etc.):**
- Great for customer management
- Zero understanding of water testing
- Can't generate water quality reports
- No AquaScore or contaminant analysis
- Expensive and over-complicated for dealers
- Months of setup and customization

**AquaReport:**
- Built specifically for water treatment dealers
- Testing + reports + CRM + sales tools in one platform
- Set up in 5 minutes, not 5 months
- Priced for small to mid-size dealerships
- Understands your workflow because it was built for your workflow

The question isn't whether you need software — it's whether you're using the *right* software.`,
      },
    ],
    faqs: [
      {
        question: "What is water testing software for dealers?",
        answer:
          "Water testing software for dealers is a mobile-friendly platform that combines field data entry, automatic water quality analysis, professional report generation, and customer management — designed specifically for how water treatment dealers work in the field.",
      },
      {
        question: "Does AquaReport replace my test kit?",
        answer:
          "No. AquaReport works alongside your existing test kit or drops. You perform the physical test as you normally would, then enter the results into AquaReport for analysis, scoring, and professional report generation.",
      },
      {
        question: "Can I use AquaReport on my iPad in the field?",
        answer:
          "Yes. AquaReport is fully responsive and works on iPads, Android tablets, phones, and laptops. Many dealers use an iPad to enter results and present reports to customers during in-home appointments.",
      },
      {
        question: "How many test parameters does AquaReport support?",
        answer:
          "AquaReport supports 20+ water quality parameters including hardness, iron, manganese, TDS, pH, chlorine, fluoride, nitrates, lead, copper, arsenic, bacteria, and more. You only enter the parameters you test — there's no minimum or maximum.",
      },
      {
        question: "Can multiple technicians use one account?",
        answer:
          "Yes. AquaReport plans include multiple team member seats. Each technician gets their own login and can generate reports independently while sharing a common customer database.",
      },
    ],
    relatedBlogSlugs: [
      "best-water-testing-software-small-dealers",
      "water-treatment-dealer-software",
      "present-water-test-results-customers",
      "water-dealer-lead-generation",
      "grow-water-treatment-business",
    ],
    ctaHeadline: "Try the Software Built for Your Workflow",
    ctaSubheadline:
      "Stop fighting generic tools that don't understand water treatment. Generate your first professional report free — see why dealers are switching.",
  },
];

export function getPillarPage(slug: string): PillarPage | undefined {
  return pillarPages.find((p) => p.slug === slug);
}

export function getAllPillarSlugs(): string[] {
  return pillarPages.map((p) => p.slug);
}
