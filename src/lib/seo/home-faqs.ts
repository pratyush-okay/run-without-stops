export const HOME_FAQS = [
  {
    question: "Does Run Without Stops work outside Sydney?",
    answer:
      "Yes. Search a city, zoom to streets, or start from where you are. The map still opens on Sydney if the browser has no location yet. Lights, crossings, and routing load for the streets on screen.",
  },
  {
    question: "Do I need an account to plan a run?",
    answer:
      "No. Click start and finish, then export GPX, SVG, or an image with no account. Sign in only to save a named line or share a private /r/ link. Those share URLs stay out of search.",
  },
  {
    question: "What is the difference between Direct and Low stops?",
    answer:
      "Direct follows your clicks on legal pedestrian streets. Low stops prefers quieter streets and can skip traffic lights, highways, and busy roads when a legal alternative exists. Avoid hills only appears under Low stops.",
  },
  {
    question: "Are the traffic-light marks a live countdown?",
    answer:
      "No. They are OpenStreetMap objects for the viewport, not a live signal. A remaining mark on the line is a wait you should expect. Move a waypoint if you refuse that corner.",
  },
] as const;
