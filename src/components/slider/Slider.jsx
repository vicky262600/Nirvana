'use client';

const Slider = () => {
  const slides = [
    {
      id: 1,
      image:
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80',
    },
    {
      id: 2,
      image:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80',
    },
    {
      id: 3,
      image:
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80',
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
