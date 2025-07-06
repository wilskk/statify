# Panduan Pengujian Komponen React

Dokumen ini memberikan panduan dan contoh untuk melakukan *unit testing* pada komponen React di dalam direktori `components/` menggunakan **Jest** dan **React Testing Library**.

## Filosofi Pengujian Komponen

Tujuan utama pengujian komponen adalah untuk memverifikasi bahwa komponen tersebut:
1. **Merender UI dengan benar** berdasarkan *props* yang diterima.
2. **Bereaksi dengan benar terhadap interaksi pengguna** (misalnya, klik tombol, pengisian form).
3. **Sesuai dengan *snapshot* terakhir** untuk mendeteksi perubahan UI yang tidak disengaja.

Pengujian harus dilakukan dari perspektif pengguna. Alih-alih menguji implementasi internal, fokuslah pada apa yang dilihat dan dapat diinteraksikan oleh pengguna.

## Strategi Pengujian

### 1. Pengujian Render (Props)

Setiap komponen harus diuji untuk memastikan ia merender output yang diharapkan untuk berbagai kombinasi *props*.

- **Contoh (`MyButton.test.tsx`)**:
  ```tsx
  import '@testing-library/jest-dom';
  import { render, screen } from '@testing-library/react';
  import MyButton from './MyButton';

  describe('MyButton', () => {
    it('should render with the correct text', () => {
      render(<MyButton>Click Me</MyButton>);
      // Cari elemen berdasarkan perannya (role) dan namanya (accessible name)
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should be disabled when the disabled prop is true', () => {
      render(<MyButton disabled={true}>Submit</MyButton>);
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toBeDisabled();
    });
  });
  ```

### 2. Pengujian Interaksi Pengguna (Events)

Untuk komponen yang interaktif, simulasikan interaksi pengguna dan verifikasi hasilnya.

- **Strategi**: Gunakan `user-event` dari React Testing Library untuk mensimulasikan interaksi yang realistis. Lakukan *mock* pada fungsi *callback* (seperti `onClick`) untuk memeriksa apakah fungsi tersebut dipanggil dengan benar.
- **Contoh (`Counter.test.tsx`)**:
  ```tsx
  import '@testing-library/jest-dom';
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import Counter from './Counter';

  describe('Counter', () => {
    it('should call the onIncrement callback when the button is clicked', async () => {
      const handleIncrement = jest.fn();
      render(<Counter onIncrement={handleIncrement} />);
      
      const user = userEvent.setup();
      const incrementButton = screen.getByRole('button', { name: /\+/i });
      
      await user.click(incrementButton);
      
      expect(handleIncrement).toHaveBeenCalledTimes(1);
    });
  });
  ```

### 3. Snapshot Testing

*Snapshot testing* sangat berguna untuk menangkap perubahan UI yang tidak terduga. Tes ini akan membuat "gambar" dari struktur komponen Anda dan membandingkannya pada setiap pengujian.

- **Perhatian**: Gunakan *snapshot testing* dengan bijak. Ini sangat baik untuk komponen yang UI-nya stabil. Jika UI sering berubah, memelihara *snapshot* bisa menjadi merepotkan.
- **Contoh (`UserProfileCard.test.tsx`)**:
  ```tsx
  import { render } from '@testing-library/react';
  import UserProfileCard from './UserProfileCard';

  it('renders correctly for a given user', () => {
    const user = { name: 'John Doe', email: 'john.doe@example.com' };
    const { container } = render(<UserProfileCard user={user} />);
    // Bandingkan render output dengan snapshot yang tersimpan
    expect(container).toMatchSnapshot();
  });
  ```

---
**Struktur File**: Selalu letakkan file pengujian di samping file komponennya (misalnya, `MyButton.tsx` dan `MyButton.test.tsx`) untuk memudahkan penemuan dan pemeliharaan. 