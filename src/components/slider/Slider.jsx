'use client';

const Slider = () => {
  const slides = [
    {
      id: 1,
      image: '/slide1.jpeg',
    },
    {
      id: 2,
      image:
        '/slide2.jpeg',
    },
    {
      id: 3,
      image:
        '/slide3.jpeg',
    },
  ];

  // Duplicate for infinite loop
  const duplicatedSlides = [...slides, ...slides];

  return (
    <div className="relative h-[80vh] overflow-hidden w-full">
      {/* Scrolling background images */}
      <div className="flex w-[200%] animate-slider">
        {duplicatedSlides.map((slide, index) => (
          <div
            key={index}
            className="w-screen h-[80vh] flex-shrink-0 bg-cover bg-center brightness-[0.6]"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      {/* Center note */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <p className="text-white text-sm md:text-base font-light px-4 text-center max-w-2xl">
        Each piece is stitched with the rhythm of the earth, letting you carry nature with you.
        </p>
      </div>
    </div>
  );
};

export default Slider;
