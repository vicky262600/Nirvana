import Navbar from "@/components/navbar/Navbar"
import Slider from "@/components/slider/Slider"
import ProductCard from "@/components/productCard/ProductCard"
// import Footer from '@/components/Footer'
import { products } from "@/data/products"

export default function Home() {
  return (
    <>
      <Navbar />
      <Slider />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sweatshirts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </main>

      {/* <Footer /> */}
    </>
  )
}
