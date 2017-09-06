Rails.application.routes.draw do
  root to: "welcome#home"
  resources :dog_breeds,
    controller: :welcome,
    path: "dog-breeds",
    only: [:index, :show, :new, :edit]

  scope :api do
    resources :dog_breeds,
      except: [:new, :edit],
      path: "dog-breeds",
      defaults: { format: :json }
  end
end
